import { and, count, eq, gt, inArray, sql } from "drizzle-orm";

import db from "@/db";
import {
  opportunities,
  opportunityInterests,
  opportunityRequiredSkills,
  volunteerRsvps,
} from "@/db/schema/opportunities";
import { interests, skills } from "@/db/schema/users";
import { NotFoundError } from "@/utils/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ListOpportunitiesParams = {
  limit: number;
  offset: number;
  search: string;
};

export type OpportunityWithSpots = {
  id: number;
  title: string | null;
  description: string | null;
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string | null;
  maxVolunteers: number | null;
  isRecurring: boolean;
  rsvpCount: number;
  spotsRemaining: number | null;
  requiredSkills: { skillId: number; skillName: string | null }[];
  interests: { interestId: number; interestName: string | null }[];
};

// ---------------------------------------------------------------------------
// List open opportunities available to volunteers
// ---------------------------------------------------------------------------

export async function listOpenOpportunities(
  params: ListOpportunitiesParams,
): Promise<{ data: OpportunityWithSpots[]; total: number }> {
  const { limit, offset, search } = params;

  const now = new Date();

  // Build base conditions: open status and future start date
  const baseConditions = and(
    eq(opportunities.status, "open"),
    gt(opportunities.startDate, now),
  );

  // Get opportunities with RSVP counts using a subquery
  const rsvpCountSubquery = db
    .select({
      opportunityId: volunteerRsvps.opportunityId,
      rsvpCount: count(volunteerRsvps.volunteerId).as("rsvp_count"),
    })
    .from(volunteerRsvps)
    .groupBy(volunteerRsvps.opportunityId)
    .as("rsvp_counts");

  // Query opportunities
  let query = db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      description: opportunities.description,
      location: opportunities.location,
      startDate: opportunities.startDate,
      endDate: opportunities.endDate,
      status: opportunities.status,
      maxVolunteers: opportunities.maxVolunteers,
      isRecurring: opportunities.isRecurring,
      rsvpCount: sql<number>`COALESCE(${rsvpCountSubquery.rsvpCount}, 0)`,
    })
    .from(opportunities)
    .leftJoin(
      rsvpCountSubquery,
      eq(opportunities.id, rsvpCountSubquery.opportunityId),
    )
    .where(baseConditions)
    .$dynamic();

  // Apply search filter if provided
  if (search) {
    query = query.where(
      and(
        baseConditions,
        sql`(${opportunities.title} ILIKE ${`%${search}%`} OR ${opportunities.description} ILIKE ${`%${search}%`} OR ${opportunities.location} ILIKE ${`%${search}%`})`,
      ),
    );
  }

  // Count open+future opportunities (approximate total, before in-memory spot filter)
  const [countResult] = await db
    .select({ total: count(opportunities.id) })
    .from(opportunities)
    .where(baseConditions);

  // Execute query with pagination
  const allOpportunities = await query
    .orderBy(opportunities.startDate)
    .limit(limit)
    .offset(offset);

  // Filter out full opportunities (where rsvpCount >= maxVolunteers)
  const availableOpportunities = allOpportunities.filter((opp) => {
    if (opp.maxVolunteers === null) return true; // No limit
    return Number(opp.rsvpCount) < opp.maxVolunteers;
  });

  // Batch-fetch required skills and interests for the returned opportunities
  const opportunityIds = availableOpportunities.map((o) => o.id);
  const requiredSkillsMap: Record<
    number,
    { skillId: number; skillName: string | null }[]
  > = {};
  const interestsMap: Record<
    number,
    { interestId: number; interestName: string | null }[]
  > = {};

  if (opportunityIds.length > 0) {
    const skillRows = await db
      .select({
        opportunityId: opportunityRequiredSkills.opportunityId,
        skillId: opportunityRequiredSkills.skillId,
        skillName: skills.name,
      })
      .from(opportunityRequiredSkills)
      .leftJoin(skills, eq(opportunityRequiredSkills.skillId, skills.id))
      .where(inArray(opportunityRequiredSkills.opportunityId, opportunityIds));

    for (const row of skillRows) {
      (requiredSkillsMap[row.opportunityId] ??= []).push({
        skillId: row.skillId,
        skillName: row.skillName,
      });
    }

    const interestRows = await db
      .select({
        opportunityId: opportunityInterests.opportunityId,
        interestId: opportunityInterests.interestId,
        interestName: interests.name,
      })
      .from(opportunityInterests)
      .leftJoin(interests, eq(opportunityInterests.interestId, interests.id))
      .where(inArray(opportunityInterests.opportunityId, opportunityIds));

    for (const row of interestRows) {
      (interestsMap[row.opportunityId] ??= []).push({
        interestId: row.interestId,
        interestName: row.interestName,
      });
    }
  }

  // Calculate spots remaining; coerce rsvpCount to number here since
  // SQL COALESCE expressions arrive as strings on the wire despite the sql<number> annotation.
  const data = availableOpportunities.map((opp) => {
    const rsvpCount = Number(opp.rsvpCount);
    return {
      ...opp,
      rsvpCount,
      spotsRemaining:
        opp.maxVolunteers === null ? null : opp.maxVolunteers - rsvpCount,
      requiredSkills: requiredSkillsMap[opp.id] ?? [],
      interests: interestsMap[opp.id] ?? [],
    };
  });

  return { data, total: countResult?.total ?? 0 };
}

// ---------------------------------------------------------------------------
// Get a single open opportunity by ID
// ---------------------------------------------------------------------------

export async function getOpenOpportunityById(
  id: number,
): Promise<OpportunityWithSpots> {
  const now = new Date();

  const rsvpCountSubquery = db
    .select({
      opportunityId: volunteerRsvps.opportunityId,
      rsvpCount: count(volunteerRsvps.volunteerId).as("rsvp_count"),
    })
    .from(volunteerRsvps)
    .groupBy(volunteerRsvps.opportunityId)
    .as("rsvp_counts");

  const rows = await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      description: opportunities.description,
      location: opportunities.location,
      startDate: opportunities.startDate,
      endDate: opportunities.endDate,
      status: opportunities.status,
      maxVolunteers: opportunities.maxVolunteers,
      isRecurring: opportunities.isRecurring,
      rsvpCount: sql<number>`COALESCE(${rsvpCountSubquery.rsvpCount}, 0)`,
    })
    .from(opportunities)
    .leftJoin(
      rsvpCountSubquery,
      eq(opportunities.id, rsvpCountSubquery.opportunityId),
    )
    .where(
      and(
        eq(opportunities.id, id),
        eq(opportunities.status, "open"),
        gt(opportunities.startDate, now),
      ),
    );

  if (rows.length === 0) {
    throw new NotFoundError("Opportunity not found");
  }

  const opp = rows[0];
  const rsvpCount = Number(opp.rsvpCount);

  const skillRows = await db
    .select({
      skillId: opportunityRequiredSkills.skillId,
      skillName: skills.name,
    })
    .from(opportunityRequiredSkills)
    .leftJoin(skills, eq(opportunityRequiredSkills.skillId, skills.id))
    .where(eq(opportunityRequiredSkills.opportunityId, id));

  const interestRows = await db
    .select({
      interestId: opportunityInterests.interestId,
      interestName: interests.name,
    })
    .from(opportunityInterests)
    .leftJoin(interests, eq(opportunityInterests.interestId, interests.id))
    .where(eq(opportunityInterests.opportunityId, id));

  return {
    ...opp,
    rsvpCount,
    spotsRemaining:
      opp.maxVolunteers === null ? null : opp.maxVolunteers - rsvpCount,
    requiredSkills: skillRows,
    interests: interestRows,
  };
}
