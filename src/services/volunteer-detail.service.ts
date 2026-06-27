import { eq } from "drizzle-orm";

import db from "@/db";
import { users, volunteers } from "@/db/schema";
import type {
  BackgroundCheckStatus,
  HoursStatus,
  NotificationPreference,
} from "@/lib/status-enums";
import {
  getOnboardingStatus,
  type OnboardingStatus,
} from "@/services/onboarding.service";
import {
  type DocumentWithSignature,
  listDocumentsWithSignatures,
} from "@/services/onboarding-documents.service";
import { fetchVolunteerDetailData } from "@/services/shared/volunteer-data";
import { applyVolunteerUpdate } from "@/services/shared/volunteer-update";
import { NotFoundError } from "@/utils/errors";

export type VolunteerDetail = {
  volunteers: typeof import("@/db/schema").volunteers.$inferSelect;
  users: typeof import("@/db/schema").users.$inferSelect | null;
  totalHours: number;
  skills: {
    skillId: number;
    skillName: string | null;
    skillDescription: string | null;
    skillCategory: string | null;
    proficiencyLevel: "no_selection" | "beginner" | "intermediate" | "advanced";
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
      | "cancelled";
    rsvpAt: Date;
    rsvpNotes: string | null;
  }[];
  hoursBreakdown: {
    id: number;
    opportunityId: number | null;
    opportunityTitle: string | null;
    date: Date;
    hours: number;
    notes: string | null;
    status: HoursStatus;
    rejectionReason: string | null;
    verifiedAt: Date | null;
  }[];
  onboardingStatus: OnboardingStatus | null;
  documentSignatures: DocumentWithSignature[];
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
  backgroundCheckStatus?: BackgroundCheckStatus;
  availability?: Record<string, unknown>;
  notificationPreference?: NotificationPreference;
  employer?: string;
  jobTitle?: string;
  city?: string;
  state?: string;
  referralSource?: string;
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

  const [detailData, onboardingStatus, documentSignatures] = await Promise.all([
    fetchVolunteerDetailData(volunteerId),
    getOnboardingStatus(volunteerId),
    listDocumentsWithSignatures(volunteerId),
  ]);

  return {
    volunteers: volunteer[0].volunteers,
    users: volunteer[0].users,
    ...detailData,
    onboardingStatus,
    documentSignatures,
  };
}

/**
 * Updates a volunteer's user and volunteer records.
 * Returns the updated volunteer record, or null if not found.
 * Throws ConflictError if the new email is already in use by another user.
 */
export async function updateVolunteerDetail(
  volunteerId: number,
  data: VolunteerDetailUpdateData,
): Promise<{
  volunteers: typeof import("@/db/schema").volunteers.$inferSelect;
  users: typeof import("@/db/schema").users.$inferSelect | null;
} | null> {
  return applyVolunteerUpdate(volunteerId, data);
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

/**
 * Soft-deletes a volunteer by setting isActive = false on their user record.
 * All related data (hours, RSVPs, skills, interests) is preserved for staff reporting.
 */
export async function deactivateVolunteer(volunteerId: number): Promise<void> {
  const volunteer = await db
    .select({ userId: volunteers.userId })
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId));

  if (volunteer.length === 0) throw new NotFoundError("Volunteer not found");

  await db
    .update(users)
    .set({ isActive: false })
    .where(eq(users.id, volunteer[0].userId));
}
