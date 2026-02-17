import { NextResponse } from "next/server";

import { removeInterest } from "@/services/volunteer-interests.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

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
    const volunteerId = Number.parseInt(id, 10);
    const interestId = Number.parseInt(interestIdParam, 10);

    if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
      return NextResponse.json(
        { message: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(interestId) || interestId <= 0) {
      return NextResponse.json(
        { message: "Invalid interest ID" },
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
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
