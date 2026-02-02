import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { volunteers } from "@/db/schema";
import { opportunities, volunteerRsvps } from "@/db/schema/opportunities";
import { requireAuth } from "@/utils/auth";
import handleError from "@/utils/handle-error";

/**
 * GET /api/volunteer/rsvps
 * Get current volunteer's RSVPs with opportunity details
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    // Only volunteers can view their RSVPs
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get volunteer record for current user
    const userId = Number.parseInt(session.user.id, 10);
    const volunteer = await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.userId, userId));

    if (volunteer.length === 0) {
      return NextResponse.json(
        { message: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const volunteerId = volunteer[0].id;

    // Fetch RSVPs with opportunity details
    const rsvps = await db
      .select({
        opportunityId: volunteerRsvps.opportunityId,
        rsvpStatus: volunteerRsvps.status,
        rsvpAt: volunteerRsvps.rsvpAt,
        notes: volunteerRsvps.notes,
        opportunityTitle: opportunities.title,
        opportunityDescription: opportunities.description,
        opportunityLocation: opportunities.location,
        opportunityStartDate: opportunities.startDate,
        opportunityEndDate: opportunities.endDate,
        opportunityStatus: opportunities.status,
      })
      .from(volunteerRsvps)
      .leftJoin(
        opportunities,
        eq(volunteerRsvps.opportunityId, opportunities.id),
      )
      .where(eq(volunteerRsvps.volunteerId, volunteerId))
      .orderBy(desc(opportunities.startDate));

    // Separate into upcoming and past
    const now = new Date();
    const upcoming = rsvps.filter(
      (r) => r.opportunityStartDate && new Date(r.opportunityStartDate) > now,
    );
    const past = rsvps.filter(
      (r) => r.opportunityStartDate && new Date(r.opportunityStartDate) <= now,
    );

    return NextResponse.json({
      data: {
        all: rsvps,
        upcoming,
        past,
      },
    });
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
