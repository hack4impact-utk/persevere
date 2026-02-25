import { NextResponse } from "next/server";

import { removeInterest } from "@/services/volunteer-interests.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
import { validateAndParseId } from "@/utils/validate-id";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; interestId: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, interestId: interestIdParam } = await params;
    const volunteerId = validateAndParseId(id);
    const interestId = validateAndParseId(interestIdParam);

    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    if (interestId === null) {
      return NextResponse.json(
        { error: "Invalid interest ID" },
        { status: 400 },
      );
    }

    await removeInterest(volunteerId, interestId);

    return NextResponse.json({
      message: "Interest removed from volunteer successfully",
      data: { volunteerId, interestId },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
