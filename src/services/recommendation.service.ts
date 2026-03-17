import { eq, inArray } from "drizzle-orm";

import db from "@/db";
import {
  opportunityInterests,
  opportunityRequiredSkills,
} from "@/db/schema/opportunities";
import {
  interests,
  skills,
  users,
  volunteerInterests,
  volunteers,
  volunteerSkills,
} from "@/db/schema/users";
import { ALL_OPPORTUNITIES_CEILING } from "@/lib/constants";
import {
  listOpenOpportunities,
  type OpportunityWithSpots,
} from "@/services/opportunities.service";
import { getVolunteerInterests } from "@/services/volunteer-interests.service";
import { getVolunteerSkills } from "@/services/volunteer-skills.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecommendedOpportunity = OpportunityWithSpots & {
  matchScore: number;
  matchingSkills: { skillId: number; skillName: string | null }[];
  matchingInterests: { interestId: number; interestName: string | null }[];
};

export type VolunteerMatch = {
  volunteerId: number;
  firstName: string;
  lastName: string;
  matchScore: number;
  matchingSkills: { skillId: number; skillName: string | null }[];
  matchingInterests: { interestId: number; interestName: string | null }[];
};

// ---------------------------------------------------------------------------
// Recommended opportunities for a volunteer
// ---------------------------------------------------------------------------

export async function getRecommendedOpportunities(
  volunteerId: number,
  limit: number,
): Promise<RecommendedOpportunity[]> {
  const [volunteerSkillRows, volunteerInterestRows] = await Promise.all([
    getVolunteerSkills(volunteerId),
    getVolunteerInterests(volunteerId),
  ]);

  const volunteerSkillIds = new Set(volunteerSkillRows.map((s) => s.skillId));
  const volunteerInterestIds = new Set(
    volunteerInterestRows.map((i) => i.interestId),
  );

  if (volunteerSkillIds.size === 0 && volunteerInterestIds.size === 0) {
    return [];
  }

  const { data: allOpps } = await listOpenOpportunities({
    limit: ALL_OPPORTUNITIES_CEILING,
    offset: 0,
    search: "",
  });

  type ScoredOpp = RecommendedOpportunity & { startDateMs: number };

  const scored: ScoredOpp[] = [];

  for (const opp of allOpps) {
    const matchingSkills = opp.requiredSkills.filter((s) =>
      volunteerSkillIds.has(s.skillId),
    );
    const matchingInterests = opp.requiredInterests.filter((i) =>
      volunteerInterestIds.has(i.interestId),
    );
    const matchScore = matchingSkills.length + matchingInterests.length;

    if (matchScore > 0) {
      scored.push({
        ...opp,
        matchScore,
        matchingSkills,
        matchingInterests,
        startDateMs: opp.startDate ? opp.startDate.getTime() : Infinity,
      });
    }
  }

  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.startDateMs - b.startDateMs;
  });

  return scored.slice(0, limit).map((opp) => {
    const result: RecommendedOpportunity = {
      id: opp.id,
      title: opp.title,
      description: opp.description,
      location: opp.location,
      startDate: opp.startDate,
      endDate: opp.endDate,
      status: opp.status,
      maxVolunteers: opp.maxVolunteers,
      isRecurring: opp.isRecurring,
      rsvpCount: opp.rsvpCount,
      spotsRemaining: opp.spotsRemaining,
      requiredSkills: opp.requiredSkills,
      requiredInterests: opp.requiredInterests,
      matchScore: opp.matchScore,
      matchingSkills: opp.matchingSkills,
      matchingInterests: opp.matchingInterests,
    };
    return result;
  });
}

// ---------------------------------------------------------------------------
// Best-matching volunteers for an event
// ---------------------------------------------------------------------------

export async function getVolunteerMatchesForEvent(
  eventId: number,
  limit: number,
): Promise<VolunteerMatch[]> {
  // 1. Fetch event requirements
  const [eventSkillRows, eventInterestRows] = await Promise.all([
    db
      .select({
        skillId: opportunityRequiredSkills.skillId,
        skillName: skills.name,
      })
      .from(opportunityRequiredSkills)
      .leftJoin(skills, eq(opportunityRequiredSkills.skillId, skills.id))
      .where(eq(opportunityRequiredSkills.opportunityId, eventId)),
    db
      .select({
        interestId: opportunityInterests.interestId,
        interestName: interests.name,
      })
      .from(opportunityInterests)
      .leftJoin(interests, eq(opportunityInterests.interestId, interests.id))
      .where(eq(opportunityInterests.opportunityId, eventId)),
  ]);

  if (eventSkillRows.length === 0 && eventInterestRows.length === 0) {
    return [];
  }

  const eventSkillIds = new Set(eventSkillRows.map((s) => s.skillId));
  const eventInterestIds = new Set(eventInterestRows.map((i) => i.interestId));

  // Build lookup maps for skill/interest names
  const skillNameById = new Map(
    eventSkillRows.map((s) => [s.skillId, s.skillName]),
  );
  const interestNameById = new Map(
    eventInterestRows.map((i) => [i.interestId, i.interestName]),
  );

  // 2. Fetch all active volunteers
  const activeVolunteers = await db
    .select({
      volunteerId: volunteers.id,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(volunteers)
    .innerJoin(users, eq(volunteers.userId, users.id))
    .where(eq(users.isActive, true));

  if (activeVolunteers.length === 0) return [];

  const volunteerIds = activeVolunteers.map((v) => v.volunteerId);

  // 3. Batch-fetch all skills and interests for active volunteers
  const [allVolSkills, allVolInterests] = await Promise.all([
    db
      .select({
        volunteerId: volunteerSkills.volunteerId,
        skillId: volunteerSkills.skillId,
      })
      .from(volunteerSkills)
      .where(inArray(volunteerSkills.volunteerId, volunteerIds)),
    db
      .select({
        volunteerId: volunteerInterests.volunteerId,
        interestId: volunteerInterests.interestId,
      })
      .from(volunteerInterests)
      .where(inArray(volunteerInterests.volunteerId, volunteerIds)),
  ]);

  // 4. Build per-volunteer maps
  const volSkillMap = new Map<number, Set<number>>();
  for (const row of allVolSkills) {
    let set = volSkillMap.get(row.volunteerId);
    if (!set) {
      set = new Set();
      volSkillMap.set(row.volunteerId, set);
    }
    set.add(row.skillId);
  }

  const volInterestMap = new Map<number, Set<number>>();
  for (const row of allVolInterests) {
    let set = volInterestMap.get(row.volunteerId);
    if (!set) {
      set = new Set();
      volInterestMap.set(row.volunteerId, set);
    }
    set.add(row.interestId);
  }

  // 5. Score each volunteer
  const matches: VolunteerMatch[] = [];
  for (const vol of activeVolunteers) {
    const volSkills = volSkillMap.get(vol.volunteerId) ?? new Set<number>();
    const volInterests =
      volInterestMap.get(vol.volunteerId) ?? new Set<number>();

    const matchingSkillIds = [...eventSkillIds].filter((id) =>
      volSkills.has(id),
    );
    const matchingInterestIds = [...eventInterestIds].filter((id) =>
      volInterests.has(id),
    );
    const matchScore = matchingSkillIds.length + matchingInterestIds.length;

    if (matchScore > 0) {
      matches.push({
        volunteerId: vol.volunteerId,
        firstName: vol.firstName,
        lastName: vol.lastName,
        matchScore,
        matchingSkills: matchingSkillIds.map((id) => ({
          skillId: id,
          skillName: skillNameById.get(id) ?? null,
        })),
        matchingInterests: matchingInterestIds.map((id) => ({
          interestId: id,
          interestName: interestNameById.get(id) ?? null,
        })),
      });
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches.slice(0, limit);
}
