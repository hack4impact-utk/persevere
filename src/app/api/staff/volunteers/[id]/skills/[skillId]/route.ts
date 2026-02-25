import { NextResponse } from "next/server";

import { removeSkill } from "@/services/volunteer-skills.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
import { validateAndParseId } from "@/utils/validate-id";

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
    const volunteerId = validateAndParseId(id);
    const skillId = validateAndParseId(skillIdParam);

    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    if (skillId === null) {
      return NextResponse.json({ error: "Invalid skill ID" }, { status: 400 });
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
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
