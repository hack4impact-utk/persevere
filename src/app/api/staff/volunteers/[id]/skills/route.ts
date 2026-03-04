import { NextResponse } from "next/server";
import { z } from "zod";

import {
  assignSkill,
  getVolunteerSkills,
} from "@/services/volunteer-skills.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";
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
    await requireStaffAuth();

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
    if (error instanceof AuthError) return authErrorResponse(error);
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
    await requireStaffAuth();

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const parsed = await parseBodyOrError(request, addSkillSchema);
    if ("response" in parsed) return parsed.response;
    const { skillId, level } = parsed.data;
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
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
