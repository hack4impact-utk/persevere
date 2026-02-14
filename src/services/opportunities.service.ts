import { and, count, eq, gt, sql } from "drizzle-orm";

import db from "@/db";
import { opportunities, volunteerRsvps } from "@/db/schema/opportunities";

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
  rsvpCount: number;
  spotsRemaining: number | null;
};

// ---------------------------------------------------------------------------
// List open opportunities available to volunteers
// ---------------------------------------------------------------------------

export async function listOpenOpportunities(
  params: ListOpportunitiesParams,
): Promise<OpportunityWithSpots[]> {
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

  // Calculate spots remaining; coerce rsvpCount to number here since
  // SQL COALESCE expressions arrive as strings on the wire despite the sql<number> annotation.
  return availableOpportunities.map((opp) => {
    const rsvpCount = Number(opp.rsvpCount);
    return {
      ...opp,
      rsvpCount,
      spotsRemaining:
        opp.maxVolunteers === null ? null : opp.maxVolunteers - rsvpCount,
    };
  });
}
