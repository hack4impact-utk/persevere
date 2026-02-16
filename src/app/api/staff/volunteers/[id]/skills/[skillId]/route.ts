import { NextResponse } from "next/server";

import { removeSkill } from "@/services/volunteer-skills.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; skillId: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, skillId: skillIdParam } = await params;
    const volunteerId = Number.parseInt(id, 10);
    const skillId = Number.parseInt(skillIdParam, 10);

    if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
      return NextResponse.json(
        { message: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(skillId) || skillId <= 0) {
      return NextResponse.json(
        { message: "Invalid skill ID" },
        { status: 400 },
      );
    }

    await removeSkill(volunteerId, skillId);

    return NextResponse.json({
      message: "Skill removed from volunteer successfully",
      data: { volunteerId, skillId },
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
