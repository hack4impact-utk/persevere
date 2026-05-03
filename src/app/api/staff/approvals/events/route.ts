import { NextResponse } from "next/server";

import { getEventsWithConfirmedCounts } from "@/services/event-rsvps.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

/**
 * GET /api/staff/approvals/events
 * Returns all events with a count of confirmed RSVPs, used for the Attendance tab split.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await getEventsWithConfirmedCounts();
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
