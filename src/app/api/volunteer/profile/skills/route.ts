import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { proficiencyLevelSchema } from "@/lib/status-enums";
import { assignSkill, removeSkill } from "@/services/volunteer-skills.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

const assignSkillSchema = z.object({
  skillId: z.number().int().positive(),
  proficiencyLevel: proficiencyLevelSchema.optional().default("no_selection"),
});

const removeSkillSchema = z.object({
  skillId: z.number().int().positive(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");

    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validation = assignSkillSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { skillId, proficiencyLevel } = validation.data;

    const result = await assignSkill(volunteerId, skillId, proficiencyLevel);

    return NextResponse.json(result, {
      status: "created" in result ? 201 : 200,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");

    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validation = removeSkillSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { skillId } = validation.data;

    await removeSkill(volunteerId, skillId);

    return NextResponse.json(
      { message: "Skill removed successfully" },
      { status: 200 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
