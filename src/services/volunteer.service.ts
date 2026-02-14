import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import db from "@/db";
import {
  interests,
  skills,
  users,
  volunteerInterests,
  volunteers,
  volunteerSkills,
} from "@/db/schema";
import {
  opportunities,
  volunteerHours,
  volunteerRsvps,
} from "@/db/schema/opportunities";
import { sendWelcomeEmail } from "@/utils/email";
import { generateSecurePassword, hashPassword } from "@/utils/password";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ListVolunteersParams = {
  page: number;
  limit: number;
  search: string | null;
  type: string | null;
  alumni: string | null;
  emailVerified: string | null;
  isActive: string | null;
};

export type ListVolunteersResult = {
  data: {
    volunteers: typeof volunteers.$inferSelect;
    users: typeof users.$inferSelect | null;
    totalHours: number;
  }[];
  total: number;
};

export type CreateVolunteerParams = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  isActive?: boolean;
  volunteerType?: string;
  isAlumni?: boolean;
  backgroundCheckStatus?: "not_required" | "pending" | "approved" | "rejected";
  mediaRelease?: boolean;
  availability?: Record<string, string | string[] | boolean | number>;
  notificationPreference?: "email" | "sms" | "both" | "none";
};

export type CreateVolunteerResult = {
  volunteer: typeof volunteers.$inferSelect;
  emailSent: boolean;
  emailError: boolean;
  backgroundCheckStatus: "not_required" | "pending" | "approved" | "rejected";
};

type TimeRange = { start: string; end: string };

export type GetVolunteerProfileResult = {
  volunteer: {
    volunteers: typeof volunteers.$inferSelect;
    users: typeof users.$inferSelect | null;
  };
  totalHours: number;
  skills: {
    skillId: number;
    skillName: string | null;
    skillDescription: string | null;
    skillCategory: string | null;
    proficiencyLevel: "beginner" | "intermediate" | "advanced" | null;
  }[];
  interests: {
    interestId: number;
    interestName: string | null;
    interestDescription: string | null;
  }[];
  recentOpportunities: {
    opportunityId: number;
    opportunityTitle: string | null;
    opportunityLocation: string | null;
    opportunityStartDate: Date | null;
    opportunityEndDate: Date | null;
    rsvpStatus:
      | "pending"
      | "confirmed"
      | "declined"
      | "attended"
      | "no_show"
      | null;
    rsvpAt: Date;
    rsvpNotes: string | null;
  }[];
  hoursBreakdown: {
    id: number;
    opportunityId: number;
    opportunityTitle: string | null;
    date: Date;
    hours: number;
    notes: string | null;
    verifiedAt: Date | null;
  }[];
};

export type VolunteerProfileUpdateParams = {
  volunteerId: number;
  phone?: string;
  bio?: string;
  availability?: {
    monday?: TimeRange[];
    tuesday?: TimeRange[];
    wednesday?: TimeRange[];
    thursday?: TimeRange[];
    friday?: TimeRange[];
    saturday?: TimeRange[];
    sunday?: TimeRange[];
  };
  notificationPreference?: "email" | "sms" | "both" | "none";
};

// ---------------------------------------------------------------------------
// List volunteers (for staff)
// ---------------------------------------------------------------------------

export async function listVolunteers(
  params: ListVolunteersParams,
): Promise<ListVolunteersResult> {
  const { page, limit, search, type, alumni, emailVerified, isActive } = params;
  const offset = (page - 1) * limit;

  const whereClauses = [];
  if (search) {
    whereClauses.push(
      or(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.email, `%${search}%`),
      ),
    );
  }
  if (type) {
    whereClauses.push(eq(volunteers.volunteerType, type));
  }
  if (alumni) {
    whereClauses.push(eq(volunteers.isAlumni, alumni === "true"));
  }
  if (emailVerified !== null) {
    whereClauses.push(eq(users.isEmailVerified, emailVerified === "true"));
  }
  if (isActive !== null) {
    whereClauses.push(eq(users.isActive, isActive === "true"));
  }

  // Build volunteer list query with hours calculation
  const baseQuery = db
    .select()
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id));

  const volunteerListRaw = await (whereClauses.length > 0
    ? baseQuery
        .where(and(...whereClauses))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(volunteers.createdAt))
    : baseQuery
        .limit(limit)
        .offset(offset)
        .orderBy(desc(volunteers.createdAt)));

  // Calculate total hours for each volunteer
  const data = await Promise.all(
    volunteerListRaw.map(async (volunteer) => {
      const hoursResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${volunteerHours.hours}), 0)`,
        })
        .from(volunteerHours)
        .where(eq(volunteerHours.volunteerId, volunteer.volunteers.id));

      const totalHours =
        typeof hoursResult[0]?.total === "number" ? hoursResult[0].total : 0;

      return {
        volunteers: volunteer.volunteers,
        users: volunteer.users,
        totalHours,
      };
    }),
  );

  // Build count query conditionally
  const countBaseQuery = db
    .select({ count: sql<number>`count(${volunteers.id})` })
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id));

  const totalResult = await (whereClauses.length > 0
    ? countBaseQuery.where(and(...whereClauses))
    : countBaseQuery);

  const total =
    typeof totalResult[0]?.count === "bigint"
      ? Number(totalResult[0].count)
      : (totalResult[0]?.count ?? 0);

  return { data, total };
}

// ---------------------------------------------------------------------------
// Create volunteer (for staff)
// ---------------------------------------------------------------------------

export async function createVolunteer(
  params: CreateVolunteerParams,
): Promise<CreateVolunteerResult> {
  // Always generate a secure random password for new volunteers
  // Users can change their password after logging in
  const plainPassword = generateSecurePassword(12);
  const hashedPassword = await hashPassword(plainPassword);

  const newUser = await db
    .insert(users)
    .values({
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phone: params.phone,
      password: hashedPassword,
      bio: params.bio,
      profilePicture: params.profilePicture,
      isActive: params.isActive ?? true,
      isEmailVerified: false, // Explicitly set to false for new volunteers
    })
    .returning({ id: users.id });

  if (!newUser[0]?.id) {
    throw new Error("Failed to create user");
  }

  const backgroundCheckStatus = params.backgroundCheckStatus ?? "not_required";

  const newVolunteerRows = await db
    .insert(volunteers)
    .values({
      userId: newUser[0].id,
      volunteerType: params.volunteerType,
      isAlumni: params.isAlumni ?? false,
      backgroundCheckStatus,
      mediaRelease: params.mediaRelease ?? false,
      availability: params.availability,
      notificationPreference: params.notificationPreference ?? "email",
    })
    .returning();

  // Send welcome email with credentials only if background check is approved or not required
  // If background check is pending, do not send email
  let emailSent = false;
  let emailError = false;
  if (
    backgroundCheckStatus === "approved" ||
    backgroundCheckStatus === "not_required"
  ) {
    try {
      await sendWelcomeEmail(params.email, params.firstName, plainPassword);
      emailSent = true;
    } catch (error) {
      // Log the error but continue - volunteer is already created
      console.error(`Failed to send welcome email to ${params.email}:`, error);
      emailError = true;
      // Note: We still return success since the volunteer was created successfully
    }
  }

  return {
    volunteer: newVolunteerRows[0],
    emailSent,
    emailError,
    backgroundCheckStatus,
  };
}

// ---------------------------------------------------------------------------
// Get volunteer profile (for volunteer self-service)
// ---------------------------------------------------------------------------

export async function getVolunteerProfile(
  volunteerId: number,
): Promise<GetVolunteerProfileResult | null> {
  const volunteer = await db
    .select()
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.id, volunteerId));

  if (volunteer.length === 0) {
    return null;
  }

  // Calculate total hours
  const hoursResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${volunteerHours.hours}), 0)`,
    })
    .from(volunteerHours)
    .where(eq(volunteerHours.volunteerId, volunteerId));

  const totalHours =
    typeof hoursResult[0]?.total === "number" ? hoursResult[0].total : 0;

  // Fetch skills with proficiency levels
  const volunteerSkillsData = await db
    .select({
      skillId: volunteerSkills.skillId,
      skillName: skills.name,
      skillDescription: skills.description,
      skillCategory: skills.category,
      proficiencyLevel: volunteerSkills.level,
    })
    .from(volunteerSkills)
    .leftJoin(skills, eq(volunteerSkills.skillId, skills.id))
    .where(eq(volunteerSkills.volunteerId, volunteerId));

  // Fetch interests
  const volunteerInterestsData = await db
    .select({
      interestId: volunteerInterests.interestId,
      interestName: interests.name,
      interestDescription: interests.description,
    })
    .from(volunteerInterests)
    .leftJoin(interests, eq(volunteerInterests.interestId, interests.id))
    .where(eq(volunteerInterests.volunteerId, volunteerId));

  // Fetch recent opportunities (last 5)
  const recentOpportunities = await db
    .select({
      opportunityId: volunteerRsvps.opportunityId,
      opportunityTitle: opportunities.title,
      opportunityLocation: opportunities.location,
      opportunityStartDate: opportunities.startDate,
      opportunityEndDate: opportunities.endDate,
      rsvpStatus: volunteerRsvps.status,
      rsvpAt: volunteerRsvps.rsvpAt,
      rsvpNotes: volunteerRsvps.notes,
    })
    .from(volunteerRsvps)
    .leftJoin(opportunities, eq(volunteerRsvps.opportunityId, opportunities.id))
    .where(eq(volunteerRsvps.volunteerId, volunteerId))
    .orderBy(desc(volunteerRsvps.rsvpAt))
    .limit(5);

  // Fetch hours breakdown (last 10 entries)
  const hoursBreakdown = await db
    .select({
      id: volunteerHours.id,
      opportunityId: volunteerHours.opportunityId,
      opportunityTitle: opportunities.title,
      date: volunteerHours.date,
      hours: volunteerHours.hours,
      notes: volunteerHours.notes,
      verifiedAt: volunteerHours.verifiedAt,
    })
    .from(volunteerHours)
    .leftJoin(opportunities, eq(volunteerHours.opportunityId, opportunities.id))
    .where(eq(volunteerHours.volunteerId, volunteerId))
    .orderBy(desc(volunteerHours.date))
    .limit(10);

  return {
    volunteer: volunteer[0],
    totalHours,
    skills: volunteerSkillsData,
    interests: volunteerInterestsData,
    recentOpportunities,
    hoursBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Update volunteer profile (for volunteer self-service)
// ---------------------------------------------------------------------------

export async function updateVolunteerProfile(
  params: VolunteerProfileUpdateParams,
): Promise<{
  volunteers: typeof volunteers.$inferSelect;
  users: typeof users.$inferSelect | null;
} | null> {
  const { volunteerId, phone, bio, availability, notificationPreference } =
    params;

  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId));

  if (volunteer.length === 0) {
    return null;
  }

  // Build update objects - only allowed fields
  const userData: {
    phone?: string;
    bio?: string;
  } = {};
  const volunteerData: {
    availability?: VolunteerProfileUpdateParams["availability"];
    notificationPreference?: "email" | "sms" | "both" | "none";
  } = {};

  if (phone !== undefined) userData.phone = phone;
  if (bio !== undefined) userData.bio = bio;

  if (availability !== undefined) volunteerData.availability = availability;
  if (notificationPreference !== undefined)
    volunteerData.notificationPreference = notificationPreference;

  // Update both tables sequentially (neon-http doesn't support transactions)
  if (Object.keys(userData).length > 0) {
    try {
      await db
        .update(users)
        .set(userData)
        .where(eq(users.id, volunteer[0].userId));
    } catch (error) {
      console.error(
        `[volunteer.service] Failed updating users table for volunteerId=${volunteerId}:`,
        error,
      );
      throw error;
    }
  }
  if (Object.keys(volunteerData).length > 0) {
    try {
      await db
        .update(volunteers)
        .set(volunteerData)
        .where(eq(volunteers.id, volunteerId));
    } catch (error) {
      console.error(
        `[volunteer.service] PARTIAL WRITE: users table may have been updated but volunteers table failed for volunteerId=${volunteerId}:`,
        error,
      );
      throw error;
    }
  }

  // Fetch updated volunteer data
  const updatedVolunteer = await db
    .select()
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.id, volunteerId));

  return updatedVolunteer[0] ?? null;
}
