import { NextResponse } from "next/server";
import { z } from "zod";

import { createSkill, listSkills } from "@/services/skills-server.service";
import { ConflictError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireAuth,
  requireStaffAuth,
} from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";

const skillCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const allSkills = await listSkills();

    return NextResponse.json({ data: allSkills });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await parseBodyOrError(request, skillCreateSchema);
    if ("response" in parsed) return parsed.response;

    const newSkill = await createSkill(parsed.data);

    return NextResponse.json(
      { message: "Skill created successfully", data: newSkill },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
