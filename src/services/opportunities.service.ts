import {
  and,
  asc,
  count,
  eq,
  gt,
  inArray,
  lte,
  notInArray,
  sql,
} from "drizzle-orm";

import db from "@/db";
import {
  eventCategories,
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
  categoryId?: number;
  locationFilter?: string;
  dateRange?: "week" | "month";
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
  categoryId: number | null;
  categoryName: string | null;
  rsvpCount: number;
  spotsRemaining: number | null;
  requiredSkills: { skillId: number; skillName: string | null }[];
  requiredInterests: { interestId: number; interestName: string | null }[];
};

// ---------------------------------------------------------------------------
// List open opportunities available to volunteers
// ---------------------------------------------------------------------------

export async function listEventCategories(): Promise<
  { id: number; name: string }[]
> {
  return db
    .select({ id: eventCategories.id, name: eventCategories.name })
    .from(eventCategories)
    .orderBy(asc(eventCategories.name));
}

export async function listOpportunityLocations(): Promise<string[]> {
  const now = new Date();
  const rows = await db
    .selectDistinct({ location: opportunities.location })
    .from(opportunities)
    .where(
      and(eq(opportunities.status, "open"), gt(opportunities.startDate, now)),
    )
    .orderBy(asc(opportunities.location));
  return rows.map((r) => r.location).filter((l): l is string => l !== null);
}

function endOfSunday(from: Date): Date {
  const d = new Date(from);
  const daysUntilSunday = d.getDay() === 0 ? 0 : 7 - d.getDay();
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function listOpenOpportunities(
  params: ListOpportunitiesParams,
): Promise<{ data: OpportunityWithSpots[]; total: number }> {
  const { limit, offset, search, categoryId, locationFilter, dateRange } =
    params;

  const now = new Date();

  // Build base conditions: open status and future start date
  const baseConditions = and(
    eq(opportunities.status, "open"),
    gt(opportunities.startDate, now),
  );

  // Get opportunities with RSVP counts using a subquery (excludes declined/cancelled)
  const rsvpCountSubquery = db
    .select({
      opportunityId: volunteerRsvps.opportunityId,
      rsvpCount: count(volunteerRsvps.volunteerId).as("rsvp_count"),
    })
    .from(volunteerRsvps)
    .where(notInArray(volunteerRsvps.status, ["declined", "cancelled"]))
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
      categoryId: opportunities.categoryId,
      categoryName: eventCategories.name,
      rsvpCount: sql<number>`COALESCE(${rsvpCountSubquery.rsvpCount}, 0)`,
    })
    .from(opportunities)
    .leftJoin(
      rsvpCountSubquery,
      eq(opportunities.id, rsvpCountSubquery.opportunityId),
    )
    .leftJoin(eventCategories, eq(opportunities.categoryId, eventCategories.id))
    .$dynamic();

  // Filter out full opportunities at the SQL level
  // An opportunity is "available" if it has no max or rsvpCount < maxVolunteers
  const availabilityFilter = sql`(${opportunities.maxVolunteers} IS NULL OR COALESCE(${rsvpCountSubquery.rsvpCount}, 0) < ${opportunities.maxVolunteers})`;

  const extraConditions = [
    search
      ? sql`(${opportunities.title} ILIKE ${`%${search}%`} OR ${opportunities.description} ILIKE ${`%${search}%`} OR ${opportunities.location} ILIKE ${`%${search}%`})`
      : undefined,
    categoryId ? eq(opportunities.categoryId, categoryId) : undefined,
    locationFilter
      ? sql`${opportunities.location} ILIKE ${`%${locationFilter}%`}`
      : undefined,
    dateRange === "week"
      ? lte(opportunities.startDate, endOfSunday(now))
      : dateRange === "month"
        ? lte(
            opportunities.startDate,
            new Date(now.getTime() + 30 * 86_400_000),
          )
        : undefined,
  ].filter(Boolean);

  const fullConditions = and(
    baseConditions,
    availabilityFilter,
    ...(extraConditions as NonNullable<(typeof extraConditions)[number]>[]),
  );

  query = query.where(fullConditions);

  // Count available opportunities (matches the filter)
  const countSubquery = db
    .select({ id: opportunities.id })
    .from(opportunities)
    .leftJoin(
      rsvpCountSubquery,
      eq(opportunities.id, rsvpCountSubquery.opportunityId),
    )
    .where(fullConditions)
    .as("available_opps");

  const [countResult] = await db.select({ total: count() }).from(countSubquery);

  // Execute query with pagination
  const availableOpportunities = await query
    .orderBy(opportunities.startDate)
    .limit(limit)
    .offset(offset);

  // Batch-fetch required skills and interests for the returned opportunities
  const opportunityIds = availableOpportunities.map((o) => o.id);
  const requiredSkillsMap: Record<
    number,
    { skillId: number; skillName: string | null }[]
  > = {};
  const requiredInterestsMap: Record<
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
      (requiredInterestsMap[row.opportunityId] ??= []).push({
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
      categoryId: opp.categoryId ?? null,
      categoryName: opp.categoryName ?? null,
      rsvpCount,
      spotsRemaining:
        opp.maxVolunteers === null ? null : opp.maxVolunteers - rsvpCount,
      requiredSkills: requiredSkillsMap[opp.id] ?? [],
      requiredInterests: requiredInterestsMap[opp.id] ?? [],
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
    .where(notInArray(volunteerRsvps.status, ["declined", "cancelled"]))
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
      categoryId: opportunities.categoryId,
      categoryName: eventCategories.name,
      rsvpCount: sql<number>`COALESCE(${rsvpCountSubquery.rsvpCount}, 0)`,
    })
    .from(opportunities)
    .leftJoin(
      rsvpCountSubquery,
      eq(opportunities.id, rsvpCountSubquery.opportunityId),
    )
    .leftJoin(eventCategories, eq(opportunities.categoryId, eventCategories.id))
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
    categoryId: opp.categoryId ?? null,
    categoryName: opp.categoryName ?? null,
    rsvpCount,
    spotsRemaining:
      opp.maxVolunteers === null ? null : opp.maxVolunteers - rsvpCount,
    requiredSkills: skillRows,
    requiredInterests: interestRows,
  };
}

export async function getOpportunityByIdForVolunteer(
  id: number,
): Promise<OpportunityWithSpots> {
  const rsvpCountSubquery = db
    .select({
      opportunityId: volunteerRsvps.opportunityId,
      rsvpCount: count(volunteerRsvps.volunteerId).as("rsvp_count"),
    })
    .from(volunteerRsvps)
    .where(notInArray(volunteerRsvps.status, ["declined", "cancelled"]))
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
      categoryId: opportunities.categoryId,
      categoryName: eventCategories.name,
      rsvpCount: sql<number>`COALESCE(${rsvpCountSubquery.rsvpCount}, 0)`,
    })
    .from(opportunities)
    .leftJoin(
      rsvpCountSubquery,
      eq(opportunities.id, rsvpCountSubquery.opportunityId),
    )
    .leftJoin(eventCategories, eq(opportunities.categoryId, eventCategories.id))
    .where(eq(opportunities.id, id));

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
    categoryId: opp.categoryId ?? null,
    categoryName: opp.categoryName ?? null,
    rsvpCount,
    spotsRemaining:
      opp.maxVolunteers === null ? null : opp.maxVolunteers - rsvpCount,
    requiredSkills: skillRows,
    requiredInterests: interestRows,
  };
}
