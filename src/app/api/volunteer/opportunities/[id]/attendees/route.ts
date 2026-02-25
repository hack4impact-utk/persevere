import { NextResponse } from "next/server";

import { getOpportunityAttendees } from "@/services/rsvp.service";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
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
    await requireAuth("volunteer");

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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
