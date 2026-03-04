import { eq } from "drizzle-orm";

import db from "@/db";
import { users, volunteers } from "@/db/schema";
import { fetchVolunteerDetailData } from "@/services/shared/volunteer-data";

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

  const detailData = await fetchVolunteerDetailData(volunteerId);

  return {
    volunteers: volunteer[0].volunteers,
    users: volunteer[0].users,
    ...detailData,
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

  if (data.firstName !== undefined) userData.firstName = data.firstName;
  if (data.lastName !== undefined) userData.lastName = data.lastName;
  if (data.email !== undefined) userData.email = data.email;
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

  // Deleting the user cascades to volunteer, which cascades to
  // volunteer_hours, volunteer_rsvps, volunteer_skills, volunteer_interests
  await db.delete(users).where(eq(users.id, volunteer[0].userId));

  return volunteer[0];
}
