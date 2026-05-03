import { NextResponse } from "next/server";

import { removeSkill } from "@/services/volunteer-skills.service";
import { requireStaffAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; skillId: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

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
    return handleRouteError(error);
  }
}
