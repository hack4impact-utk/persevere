import { and, count, eq, ilike, or, sql } from "drizzle-orm";

import db from "@/db";
import {
  users,
  volunteerInterests,
  volunteers,
  volunteerSkills,
} from "@/db/schema";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OnboardingChecklist = {
  profileFilled: boolean;
  availabilitySet: boolean;
  skillsAdded: boolean;
  interestsAdded: boolean;
  mediaReleaseSigned: boolean;
};

export type OnboardingStatus = OnboardingChecklist & {
  completionPercentage: number;
  onboardingComplete: boolean;
};

export type VolunteerOnboardingSummary = {
  volunteerId: number;
  firstName: string;
  lastName: string;
  email: string;
  completionPercentage: number;
  onboardingComplete: boolean;
  checklist: OnboardingChecklist;
};

export type ListOnboardingParams = {
  page: number;
  limit: number;
  search: string | null;
};

export type ListOnboardingResult = {
  data: VolunteerOnboardingSummary[];
  total: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CHECKLIST_ITEMS = 5;

function buildChecklist(
  phone: string | null | undefined,
  bio: string | null | undefined,
  availability: unknown,
  skillsCount: number,
  interestsCount: number,
  mediaRelease: boolean,
): OnboardingChecklist {
  return {
    profileFilled: Boolean(phone && phone.trim() !== "" && bio && bio.trim() !== ""),
    availabilitySet: availability != null && JSON.stringify(availability) !== "{}",
    skillsAdded: skillsCount > 0,
    interestsAdded: interestsCount > 0,
    mediaReleaseSigned: mediaRelease,
  };
}

function completionFromChecklist(checklist: OnboardingChecklist): number {
  const completed = Object.values(checklist).filter(Boolean).length;
  return Math.round((completed / CHECKLIST_ITEMS) * 100);
}

// ---------------------------------------------------------------------------
// Volunteer self-service: get own onboarding status
// ---------------------------------------------------------------------------

export async function getOnboardingStatus(
  volunteerId: number,
): Promise<OnboardingStatus | null> {
  const rows = await db
    .select({
      phone: users.phone,
      bio: users.bio,
      availability: volunteers.availability,
      mediaRelease: volunteers.mediaRelease,
      skillsCount: sql<number>`(SELECT COUNT(*) FROM volunteer_skills WHERE volunteer_id = ${volunteers.id})`,
      interestsCount: sql<number>`(SELECT COUNT(*) FROM volunteer_interests WHERE volunteer_id = ${volunteers.id})`,
    })
    .from(volunteers)
    .innerJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.id, volunteerId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  const checklist = buildChecklist(
    row.phone,
    row.bio,
    row.availability,
    Number(row.skillsCount),
    Number(row.interestsCount),
    row.mediaRelease,
  );
  const completionPercentage = completionFromChecklist(checklist);

  return {
    ...checklist,
    completionPercentage,
    onboardingComplete: completionPercentage === 100,
  };
}

// ---------------------------------------------------------------------------
// Staff: list all volunteers with onboarding %
// ---------------------------------------------------------------------------

export async function listVolunteerOnboarding(
  params: ListOnboardingParams,
): Promise<ListOnboardingResult> {
  const { page, limit = DEFAULT_PAGE_SIZE, search } = params;
  const offset = (page - 1) * limit;

  const whereClauses = [];
  if (search && search.trim() !== "") {
    const pattern = `%${search.trim()}%`;
    whereClauses.push(
      or(
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(users.email, pattern),
      ),
    );
  }

  const whereCondition =
    whereClauses.length > 0 ? and(...whereClauses) : undefined;

  // Count total
  const [countRow] = await db
    .select({ value: count() })
    .from(volunteers)
    .innerJoin(users, eq(volunteers.userId, users.id))
    .where(whereCondition);

  const total = countRow?.value ?? 0;

  // Fetch volunteer rows with skill/interest counts via correlated sub-queries
  const rows = await db
    .select({
      volunteerId: volunteers.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      bio: users.bio,
      availability: volunteers.availability,
      mediaRelease: volunteers.mediaRelease,
      skillsCount: sql<number>`(SELECT COUNT(*) FROM volunteer_skills WHERE volunteer_id = ${volunteers.id})`,
      interestsCount: sql<number>`(SELECT COUNT(*) FROM volunteer_interests WHERE volunteer_id = ${volunteers.id})`,
    })
    .from(volunteers)
    .innerJoin(users, eq(volunteers.userId, users.id))
    .where(whereCondition)
    .limit(limit)
    .offset(offset)
    .orderBy(volunteers.createdAt);

  const data: VolunteerOnboardingSummary[] = rows.map((row) => {
    const checklist = buildChecklist(
      row.phone,
      row.bio,
      row.availability,
      Number(row.skillsCount),
      Number(row.interestsCount),
      row.mediaRelease,
    );
    const completionPercentage = completionFromChecklist(checklist);
    return {
      volunteerId: row.volunteerId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      completionPercentage,
      onboardingComplete: completionPercentage === 100,
      checklist,
    };
  });

  return { data, total };
}
