import { NextResponse } from "next/server";
import { z } from "zod";

import {
  assignSkill,
  getVolunteerSkills,
} from "@/services/volunteer-skills.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
import { validateAndParseId } from "@/utils/validate-id";

const addSkillSchema = z.object({
  skillId: z.number().int().positive("Skill ID must be a positive integer"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const data = await getVolunteerSkills(volunteerId);

    return NextResponse.json({ data });
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const json = await request.json();
    const result = addSkillSchema.safeParse(json);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const { skillId, level } = result.data;
    const outcome = await assignSkill(volunteerId, skillId, level);

    if ("updated" in outcome) {
      return NextResponse.json({
        message: "Skill level updated successfully",
        data: { volunteerId, skillId, level },
      });
    }

    return NextResponse.json(
      {
        message: "Skill assigned successfully",
        data: { volunteerId, skillId, level },
      },
      { status: 201 },
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
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
