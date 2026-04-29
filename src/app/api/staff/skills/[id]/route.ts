import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteSkill,
  getSkillById,
  updateSkill,
} from "@/services/skills-server.service";
import { requireAuth, requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

const skillUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const skillId = validateAndParseId(id);
    if (skillId === null) {
      return NextResponse.json({ error: "Invalid skill ID" }, { status: 400 });
    }

    const skill = await getSkillById(skillId);

    return NextResponse.json({ data: skill });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const skillId = validateAndParseId(id);
    if (skillId === null) {
      return NextResponse.json({ error: "Invalid skill ID" }, { status: 400 });
    }

    const parsed = await parseBodyOrError(request, skillUpdateSchema);
    if ("response" in parsed) return parsed.response;

    const updatedSkill = await updateSkill(skillId, parsed.data);

    return NextResponse.json({
      message: "Skill updated successfully",
      data: updatedSkill,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const skillId = validateAndParseId(id);
    if (skillId === null) {
      return NextResponse.json({ error: "Invalid skill ID" }, { status: 400 });
    }

    await deleteSkill(skillId);

    return NextResponse.json({ message: "Skill deleted successfully" });
  } catch (error) {
    return handleRouteError(error);
  }
}
