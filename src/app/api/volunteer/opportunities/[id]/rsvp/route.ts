import { NextResponse } from "next/server";

import { cancelRsvp, createRsvp, RsvpError } from "@/services/rsvp.service";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
import { validateAndParseId } from "@/utils/validate-id";

/**
 * POST /api/volunteer/opportunities/[id]/rsvp
 * RSVP to an opportunity
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const opportunityId = validateAndParseId(id);
    if (opportunityId === null) {
      return NextResponse.json(
        { message: "Invalid opportunity ID" },
        { status: 400 },
      );
    }

    const userId = Number.parseInt(session.user.id, 10);
    const data = await createRsvp(userId, opportunityId);

    return NextResponse.json(
      { message: "RSVP created successfully", data },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    if (error instanceof RsvpError) {
      const status =
        error.code === "VOLUNTEER_NOT_FOUND" ||
        error.code === "OPPORTUNITY_NOT_FOUND"
          ? 404
          : 400;
      return NextResponse.json({ message: error.message }, { status });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

/**
 * DELETE /api/volunteer/opportunities/[id]/rsvp
 * Cancel RSVP to an opportunity
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const opportunityId = validateAndParseId(id);
    if (opportunityId === null) {
      return NextResponse.json(
        { message: "Invalid opportunity ID" },
        { status: 400 },
      );
    }

    const userId = Number.parseInt(session.user.id, 10);
    const data = await cancelRsvp(userId, opportunityId);

    return NextResponse.json({ message: "RSVP cancelled successfully", data });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    if (error instanceof RsvpError) {
      const status =
        error.code === "RSVP_NOT_FOUND" || error.code === "VOLUNTEER_NOT_FOUND"
          ? 404
          : 400;
      return NextResponse.json({ message: error.message }, { status });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
