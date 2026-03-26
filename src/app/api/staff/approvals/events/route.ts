import { NextResponse } from "next/server";

import { getEventsWithConfirmedCounts } from "@/services/event-rsvps.service";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";

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
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
