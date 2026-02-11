import { and, asc, eq, gt, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db";
import {
  opportunities,
  volunteerHours,
  volunteerRsvps,
} from "@/db/schema/opportunities";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import handleError from "@/utils/handle-error";

export const dynamic = "force-dynamic";

function getVolunteerId(req: NextRequest): string | null {
  // If you set this in middleware after auth, this is the cleanest:
  const fromHeader = req.headers.get("x-volunteer-id");
  if (fromHeader) return fromHeader;

  // Dev fallback:
  const url = new URL(req.url);
  return url.searchParams.get("volunteerId");
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function GET(req: NextRequest) {
  try {
    const volunteerId = getVolunteerId(req);
    if (!volunteerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const [upcomingRsvps, hoursByStatus] = await Promise.all([
      // Upcoming RSVPs: confirmed + opportunity.startDate > now (for current volunteer)
      db
        .select({
          rsvpId: volunteerRsvps.id,
          rsvpStatus: volunteerRsvps.status,

          opportunityId: opportunities.id,
          title: opportunities.title,
          startDate: opportunities.startDate,
          endDate: opportunities.endDate,
          location: opportunities.location,
        })
        .from(volunteerRsvps)
        .innerJoin(
          opportunities,
          eq(volunteerRsvps.opportunityId, opportunities.id)
        )
        .where(
          and(
            eq(volunteerRsvps.volunteerId, volunteerId),
            eq(volunteerRsvps.status, "CONFIRMED"),
            gt(opportunities.startDate, now)
          )
        )
        .orderBy(asc(opportunities.startDate)),

      // Total hours: verified vs pending (for current volunteer)
      db
        .select({
          status: volunteerHours.status,
          total: sql<number>`coalesce(sum(${volunteerHours.hours}), 0)`,
        })
        .from(volunteerHours)
        .where(eq(volunteerHours.volunteerId, volunteerId))
        .groupBy(volunteerHours.status),
    ]);

    let verified = 0;
    let pending = 0;

    for (const row of hoursByStatus) {
      const total = Number(row.total ?? 0);
      if (row.status === "VERIFIED") verified += total;
      if (row.status === "PENDING") pending += total;
    }

    return NextResponse.json({
      volunteerId,
      upcomingRsvps,
      hours: {
        verified,
        pending,
        total: verified + pending,
      },
    });
  } catch (error) {
    console.error("GET /api/volunteer/dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load volunteer dashboard" },
      { status: 500 }
    );
  }
}
