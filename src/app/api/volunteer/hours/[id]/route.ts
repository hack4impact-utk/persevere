import { NextResponse } from "next/server";

import { volunteerDeleteHours } from "@/services/volunteer-hours.service";
import { ConflictError, NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";
import { validateAndParseId } from "@/utils/validate-id";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");
    const { id } = await params;
    const hoursId = validateAndParseId(id);
    if (hoursId === null) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }
    await volunteerDeleteHours(hoursId, volunteerId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
