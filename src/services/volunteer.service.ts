import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import db from "@/db";
import { users, volunteers } from "@/db/schema";
import { volunteerHours } from "@/db/schema/opportunities";
import { toNumber } from "@/services/shared/db-helpers";
import { fetchVolunteerDetailData } from "@/services/shared/volunteer-data";
import { NotFoundError } from "@/utils/errors";
import { sendWelcomeEmail } from "@/utils/server/email";
import { generateSecurePassword, hashPassword } from "@/utils/server/password";

import {
  buildChecklist,
  completionFromChecklist,
  getOnboardingStatus,
  type OnboardingStatus,
} from "./onboarding.service";

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
    completionPercentage: number;
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
  employer?: string;
  jobTitle?: string;
  city?: string;
  state?: string;
  referralSource?: string;
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
    proficiencyLevel:
      | "no_selection"
      | "beginner"
      | "intermediate"
      | "advanced"
      | null;
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
    status: "pending" | "approved" | "rejected";
    rejectionReason: string | null;
    verifiedAt: Date | null;
  }[];
  onboardingStatus: OnboardingStatus | null;
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
  employer?: string;
  jobTitle?: string;
  city?: string;
  state?: string;
  referralSource?: string;
  isAlumni?: boolean;
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

  // Build volunteer list query with hours aggregated via LEFT JOIN (eliminates N+1)
  const baseQuery = db
    .select({
      volunteers: volunteers,
      users: users,
      totalHours: sql<number>`COALESCE(SUM(${volunteerHours.hours}), 0)`,
      skillsCount: sql<number>`(SELECT COUNT(*) FROM volunteer_skills WHERE volunteer_id = ${volunteers.id})`,
      interestsCount: sql<number>`(SELECT COUNT(*) FROM volunteer_interests WHERE volunteer_id = ${volunteers.id})`,
      requiredDocsCount: sql<number>`(SELECT COUNT(*) FROM onboarding_documents WHERE required = true AND is_active = true AND action_type != 'informational')`,
      respondedDocsCount: sql<number>`(SELECT COUNT(*) FROM volunteer_document_signatures WHERE volunteer_id = ${volunteers.id} AND document_id IN (SELECT id FROM onboarding_documents WHERE required = true AND is_active = true AND action_type != 'informational'))`,
    })
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .leftJoin(
      volunteerHours,
      and(
        eq(volunteerHours.volunteerId, volunteers.id),
        eq(volunteerHours.status, "approved"),
      ),
    )
    .groupBy(volunteers.id, users.id)
    .$dynamic();

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

  const data = volunteerListRaw.map((row) => {
    const checklist = buildChecklist(
      row.users?.phone,
      row.users?.bio,
      row.volunteers.availability,
      Number(row.skillsCount),
      Number(row.interestsCount),
      Number(row.requiredDocsCount),
      Number(row.respondedDocsCount),
    );
    const completionPercentage = completionFromChecklist(checklist);

    return {
      volunteers: row.volunteers,
      users: row.users,
      totalHours: toNumber(row.totalHours),
      completionPercentage,
    };
  });

  // Build count query conditionally
  const countBaseQuery = db
    .select({ count: sql<number>`count(${volunteers.id})` })
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id));

  const totalResult = await (whereClauses.length > 0
    ? countBaseQuery.where(and(...whereClauses))
    : countBaseQuery);

  const total = toNumber(totalResult[0]?.count);

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
      employer: params.employer,
      jobTitle: params.jobTitle,
      city: params.city,
      state: params.state,
      referralSource: params.referralSource,
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

  const detailData = await fetchVolunteerDetailData(volunteerId);
  const onboardingStatus = await getOnboardingStatus(volunteerId);

  return {
    volunteer: volunteer[0],
    ...detailData,
    onboardingStatus,
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
  const {
    volunteerId,
    phone,
    bio,
    availability,
    notificationPreference,
    employer,
    jobTitle,
    city,
    state,
    referralSource,
    isAlumni,
  } = params;

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
    employer?: string;
    jobTitle?: string;
    city?: string;
    state?: string;
    referralSource?: string;
    isAlumni?: boolean;
  } = {};

  if (phone !== undefined) userData.phone = phone;
  if (bio !== undefined) userData.bio = bio;

  if (availability !== undefined) volunteerData.availability = availability;
  if (notificationPreference !== undefined)
    volunteerData.notificationPreference = notificationPreference;
  if (employer !== undefined) volunteerData.employer = employer;
  if (jobTitle !== undefined) volunteerData.jobTitle = jobTitle;
  if (city !== undefined) volunteerData.city = city;
  if (state !== undefined) volunteerData.state = state;
  if (referralSource !== undefined)
    volunteerData.referralSource = referralSource;
  if (isAlumni !== undefined) volunteerData.isAlumni = isAlumni;

  // Update both tables sequentially (neon-http doesn't support transactions)
  if (Object.keys(volunteerData).length > 0) {
    try {
      await db
        .update(volunteers)
        .set(volunteerData)
        .where(eq(volunteers.id, volunteerId));
    } catch (error) {
      console.error(
        `[volunteer.service] Failed updating volunteers table for volunteerId=${volunteerId}:`,
        error,
      );
      throw error;
    }
  }
  if (Object.keys(userData).length > 0) {
    try {
      await db
        .update(users)
        .set(userData)
        .where(eq(users.id, volunteer[0].userId));
    } catch (error) {
      console.error(
        `[volunteer.service] PARTIAL WRITE: volunteers table may have been updated but users table failed for volunteerId=${volunteerId}:`,
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

export async function resetVolunteerCredentials(
  volunteerId: number,
): Promise<{ email: string; firstName: string; plainPassword: string }> {
  const volunteerData = await db
    .select()
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.id, volunteerId));

  if (volunteerData.length === 0 || !volunteerData[0]?.users) {
    throw new NotFoundError("Volunteer not found");
  }

  const user = volunteerData[0].users;
  const plainPassword = generateSecurePassword(12);
  const hashedPassword = await hashPassword(plainPassword);

  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return { email: user.email, firstName: user.firstName, plainPassword };
}
