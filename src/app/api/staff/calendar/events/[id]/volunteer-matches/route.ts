import { NextResponse } from "next/server";

import { VOLUNTEER_MATCHES_LIMIT } from "@/lib/constants";
import { getVolunteerMatchesForEvent } from "@/services/recommendation.service";
import { requireStaffAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

/**
 * GET /api/staff/calendar/events/[id]/volunteer-matches
 * Returns top volunteer matches for a calendar event, scored by skills + interests overlap
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

    const matches = await getVolunteerMatchesForEvent(
      eventId,
      VOLUNTEER_MATCHES_LIMIT,
    );
    return NextResponse.json({ data: matches });
  } catch (error) {
    return handleRouteError(error);
  }
}
