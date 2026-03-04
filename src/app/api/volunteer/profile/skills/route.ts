import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { assignSkill, removeSkill } from "@/services/volunteer-skills.service";
import { NotFoundError } from "@/utils/errors";
import { AuthError, requireAuth } from "@/utils/server/auth";

const assignSkillSchema = z.object({
  skillId: z.number().int().positive(),
  proficiencyLevel: z.enum(["beginner", "intermediate", "advanced"]),
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

    return NextResponse.json(result, { status: 200 });
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

    console.error("[POST /api/volunteer/profile/skills] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("[DELETE /api/volunteer/profile/skills] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
