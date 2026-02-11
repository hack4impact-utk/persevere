import { and, count, eq, gt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { opportunities, volunteerRsvps } from "@/db/schema/opportunities";
import { requireAuth } from "@/utils/auth";
import handleError from "@/utils/handle-error";

/**
 * GET /api/volunteer/opportunities
 * List open opportunities that are not full
 * Query params: limit, offset, search
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    // Only volunteers can browse opportunities
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") || "20", 10), 1),
      100,
    );
    const offset = Math.max(
      Number.parseInt(searchParams.get("offset") || "0", 10),
      0,
    );
    const search = searchParams.get("search")?.trim() || "";

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
    const opportunitiesWithSpots = availableOpportunities.map((opp) => {
      const rsvpCount = Number(opp.rsvpCount);
      return {
        ...opp,
        rsvpCount,
        spotsRemaining:
          opp.maxVolunteers === null ? null : opp.maxVolunteers - rsvpCount,
      };
    });

    return NextResponse.json({ data: opportunitiesWithSpots });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
