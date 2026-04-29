import { NextResponse } from "next/server";

import { getEventRsvps } from "@/services/event-rsvps.service";
import { requireStaffAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

/**
 * GET /api/staff/calendar/events/[id]/rsvps
 * Fetch all RSVPs (enrolled volunteers) for a calendar event
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const eventId = validateAndParseId(id);
    if (eventId === null) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const rsvps = await getEventRsvps(eventId);
    return NextResponse.json({ data: rsvps });
  } catch (error) {
    return handleRouteError(error);
  }
}
