import { NextResponse } from "next/server";

import { getVolunteerRsvps, RsvpError } from "@/services/rsvp.service";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

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

    const userId = Number.parseInt(session.user.id, 10);
    const rsvps = await getVolunteerRsvps(userId);

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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    if (error instanceof RsvpError && error.code === "VOLUNTEER_NOT_FOUND") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
