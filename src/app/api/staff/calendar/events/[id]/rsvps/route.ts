import { NextResponse } from "next/server";

import { getEventRsvps } from "@/services/event-rsvps.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
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
    await requireAuth("staff");

    const { id } = await params;
    const eventId = validateAndParseId(id);
    if (eventId === null) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const rsvps = await getEventRsvps(eventId);
    return NextResponse.json({ data: rsvps });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
