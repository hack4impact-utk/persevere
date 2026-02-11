import { eq, gt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import {
  opportunities,
  volunteerHours,
  volunteerRsvps,
  volunteers,
} from "@/db/schema/opportunities";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import handleError from "@/utils/handle-error";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function GET() {
  try {
    const now = new Date();

    const [activeVolunteers, totalHours, upcomingOpps, pendingRsvps] =
      await Promise.all([
        // COUNT volunteers (active)
        db
          .select({ value: sql<number>`count(*)` })
          .from(volunteers)
          .where(eq(volunteers.status, "ACTIVE"))
          .then((r) => Number(r[0]?.value ?? 0)),

        // SUM volunteerHours
        db
          .select({
            value: sql<number>`coalesce(sum(${volunteerHours.hours}), 0)`,
          })
          .from(volunteerHours)
          .then((r) => Number(r[0]?.value ?? 0)),

        // COUNT opportunities (upcoming)
        db
          .select({ value: sql<number>`count(*)` })
          .from(opportunities)
          .where(gt(opportunities.startDate, now))
          .then((r) => Number(r[0]?.value ?? 0)),

        // COUNT volunteerRsvps (pending)
        db
          .select({ value: sql<number>`count(*)` })
          .from(volunteerRsvps)
          .where(eq(volunteerRsvps.status, "PENDING"))
          .then((r) => Number(r[0]?.value ?? 0)),
      ]);

    return NextResponse.json({
      volunteersActive: activeVolunteers,
      volunteerHoursTotal: totalHours,
      opportunitiesUpcoming: upcomingOpps,
      volunteerRsvpsPending: pendingRsvps,
    });
  } catch (error) {
    console.error("GET /api/staff/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Failed to load staff dashboard stats" },
      { status: 500 },
    );
  }
}
