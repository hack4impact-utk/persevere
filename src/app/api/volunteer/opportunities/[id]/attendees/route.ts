import { NextResponse } from "next/server";

import { getOpportunityAttendees } from "@/services/rsvp.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

/**
 * GET /api/volunteer/opportunities/[id]/attendees
 * Returns first names of confirmed+pending attendees for an opportunity.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const parsedId = validateAndParseId(id);
    if (parsedId === null) {
      return NextResponse.json(
        { error: "Invalid opportunity ID" },
        { status: 400 },
      );
    }

    const attendees = await getOpportunityAttendees(parsedId);
    return NextResponse.json({ data: attendees });
  } catch (error) {
    return handleRouteError(error);
  }
}
