import { desc, eq, sql } from "drizzle-orm";

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
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export type VolunteerDetail = {
  volunteers: typeof import("@/db/schema").volunteers.$inferSelect;
  users: typeof import("@/db/schema").users.$inferSelect | null;
  totalHours: number;
  skills: {
    skillId: number;
    skillName: string | null;
    skillDescription: string | null;
    skillCategory: string | null;
    proficiencyLevel: "beginner" | "intermediate" | "advanced";
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
    rsvpStatus: "pending" | "confirmed" | "declined" | "attended" | "no_show";
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

export type VolunteerDetailUpdateData = {
  // User fields
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  isActive?: boolean;
  // Volunteer fields
  volunteerType?: string;
  isAlumni?: boolean;
  backgroundCheckStatus?: "not_required" | "pending" | "approved" | "rejected";
  mediaRelease?: boolean;
  availability?: Record<string, unknown>;
  notificationPreference?: "email" | "sms" | "both" | "none";
};

/**
 * Fetches full volunteer profile including hours, skills, interests, and recent activity.
 * Returns null if the volunteer is not found.
 */
export async function getVolunteerDetail(
  volunteerId: number,
): Promise<VolunteerDetail | null> {
  const volunteer = await db
    .select()
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.id, volunteerId));

  if (volunteer.length === 0) return null;

  const [
    hoursResult,
    volunteerSkillsData,
    volunteerInterestsData,
    recentOpportunities,
    hoursBreakdown,
  ] = await Promise.all([
    db
      .select({ total: sql<number>`COALESCE(SUM(${volunteerHours.hours}), 0)` })
      .from(volunteerHours)
      .where(eq(volunteerHours.volunteerId, volunteerId)),

    db
      .select({
        skillId: volunteerSkills.skillId,
        skillName: skills.name,
        skillDescription: skills.description,
        skillCategory: skills.category,
        proficiencyLevel: volunteerSkills.level,
      })
      .from(volunteerSkills)
      .leftJoin(skills, eq(volunteerSkills.skillId, skills.id))
      .where(eq(volunteerSkills.volunteerId, volunteerId)),

    db
      .select({
        interestId: volunteerInterests.interestId,
        interestName: interests.name,
        interestDescription: interests.description,
      })
      .from(volunteerInterests)
      .leftJoin(interests, eq(volunteerInterests.interestId, interests.id))
      .where(eq(volunteerInterests.volunteerId, volunteerId)),

    db
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
      .leftJoin(
        opportunities,
        eq(volunteerRsvps.opportunityId, opportunities.id),
      )
      .where(eq(volunteerRsvps.volunteerId, volunteerId))
      .orderBy(desc(volunteerRsvps.rsvpAt))
      .limit(5),

    db
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
      .leftJoin(
        opportunities,
        eq(volunteerHours.opportunityId, opportunities.id),
      )
      .where(eq(volunteerHours.volunteerId, volunteerId))
      .orderBy(desc(volunteerHours.date))
      .limit(DEFAULT_PAGE_SIZE),
  ]);

  const totalHours =
    typeof hoursResult[0]?.total === "number" ? hoursResult[0].total : 0;

  return {
    volunteers: volunteer[0].volunteers,
    users: volunteer[0].users,
    totalHours,
    skills: volunteerSkillsData,
    interests: volunteerInterestsData,
    recentOpportunities,
    hoursBreakdown,
  };
}

/**
 * Updates a volunteer's user and volunteer records.
 * Returns the updated volunteer record, or null if not found.
 */
export async function updateVolunteerDetail(
  volunteerId: number,
  data: VolunteerDetailUpdateData,
): Promise<{
  volunteers: typeof import("@/db/schema").volunteers.$inferSelect;
  users: typeof import("@/db/schema").users.$inferSelect | null;
} | null> {
  const existing = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId));

  if (existing.length === 0) return null;

  const userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    bio?: string;
    profilePicture?: string;
    isActive?: boolean;
  } = {};

  const volunteerData: {
    volunteerType?: string;
    isAlumni?: boolean;
    backgroundCheckStatus?:
      | "not_required"
      | "pending"
      | "approved"
      | "rejected";
    mediaRelease?: boolean;
    availability?: Record<string, unknown>;
    notificationPreference?: "email" | "sms" | "both" | "none";
  } = {};

  if (data.firstName) userData.firstName = data.firstName;
  if (data.lastName) userData.lastName = data.lastName;
  if (data.email) userData.email = data.email;
  if (data.phone !== undefined) userData.phone = data.phone;
  if (data.bio !== undefined) userData.bio = data.bio;
  if (data.profilePicture !== undefined)
    userData.profilePicture = data.profilePicture;
  if (data.isActive !== undefined) userData.isActive = data.isActive;

  if (data.volunteerType !== undefined)
    volunteerData.volunteerType = data.volunteerType;
  if (data.isAlumni !== undefined) volunteerData.isAlumni = data.isAlumni;
  if (data.backgroundCheckStatus !== undefined)
    volunteerData.backgroundCheckStatus = data.backgroundCheckStatus;
  if (data.mediaRelease !== undefined)
    volunteerData.mediaRelease = data.mediaRelease;
  if (data.availability !== undefined)
    volunteerData.availability = data.availability;
  if (data.notificationPreference !== undefined)
    volunteerData.notificationPreference = data.notificationPreference;

  if (Object.keys(userData).length > 0) {
    await db
      .update(users)
      .set(userData)
      .where(eq(users.id, existing[0].userId));
  }

  if (Object.keys(volunteerData).length > 0) {
    await db
      .update(volunteers)
      .set(volunteerData)
      .where(eq(volunteers.id, volunteerId));
  }

  const updated = await db
    .select()
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.id, volunteerId));

  return updated[0] ?? null;
}

/**
 * Deletes the user record associated with a volunteer (cascades to volunteer record).
 * Returns the deleted volunteer record, or null if not found.
 */
export async function deleteVolunteer(
  volunteerId: number,
): Promise<typeof import("@/db/schema").volunteers.$inferSelect | null> {
  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId));

  if (volunteer.length === 0) return null;

  await db
    .delete(volunteerHours)
    .where(eq(volunteerHours.volunteerId, volunteerId));
  await db
    .delete(volunteerRsvps)
    .where(eq(volunteerRsvps.volunteerId, volunteerId));
  await db
    .delete(volunteerSkills)
    .where(eq(volunteerSkills.volunteerId, volunteerId));
  await db
    .delete(volunteerInterests)
    .where(eq(volunteerInterests.volunteerId, volunteerId));
  await db.delete(volunteers).where(eq(volunteers.id, volunteerId));

  const deletedUser = await db
    .delete(users)
    .where(eq(users.id, volunteer[0].userId))
    .returning();

  if (deletedUser.length === 0) return null;

  return volunteer[0];
}
