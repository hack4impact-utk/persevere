import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import { skills, volunteerSkills } from "@/db/schema";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

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
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const skillId = Number.parseInt(id, 10);

    if (!Number.isInteger(skillId) || skillId <= 0) {
      return NextResponse.json(
        { message: "Invalid skill ID" },
        { status: 400 },
      );
    }

    const skill = await db.select().from(skills).where(eq(skills.id, skillId));

    if (skill.length === 0) {
      return NextResponse.json({ message: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json({ data: skill[0] });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
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
    const skillId = Number.parseInt(id, 10);

    if (!Number.isInteger(skillId) || skillId <= 0) {
      return NextResponse.json(
        { message: "Invalid skill ID" },
        { status: 400 },
      );
    }

    const json = await request.json();
    const result = skillUpdateSchema.safeParse(json);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const data = result.data;

    const skill = await db.select().from(skills).where(eq(skills.id, skillId));

    if (skill.length === 0) {
      return NextResponse.json({ message: "Skill not found" }, { status: 404 });
    }

    // Check if updating name and if it conflicts with existing
    if (data.name && data.name !== skill[0].name) {
      const existing = await db
        .select()
        .from(skills)
        .where(eq(skills.name, data.name));

      if (existing.length > 0) {
        return NextResponse.json(
          { message: "A skill with this name already exists" },
          { status: 400 },
        );
      }
    }

    const updateData: {
      name?: string;
      description?: string;
      category?: string;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;

    if (Object.keys(updateData).length > 0) {
      await db.update(skills).set(updateData).where(eq(skills.id, skillId));
    }

    const updatedSkill = await db
      .select()
      .from(skills)
      .where(eq(skills.id, skillId));

    return NextResponse.json({
      message: "Skill updated successfully",
      data: updatedSkill[0],
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
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
    const skillId = Number.parseInt(id, 10);

    if (!Number.isInteger(skillId) || skillId <= 0) {
      return NextResponse.json(
        { message: "Invalid skill ID" },
        { status: 400 },
      );
    }

    const skill = await db.select().from(skills).where(eq(skills.id, skillId));

    if (skill.length === 0) {
      return NextResponse.json({ message: "Skill not found" }, { status: 404 });
    }

    // Check if skill is in use by any volunteers
    const usageCount = await db
      .select()
      .from(volunteerSkills)
      .where(eq(volunteerSkills.skillId, skillId));

    if (usageCount.length > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete skill: it is assigned to ${usageCount.length} volunteer(s)`,
        },
        { status: 400 },
      );
    }

    await db.delete(skills).where(eq(skills.id, skillId));

    return NextResponse.json({
      message: "Skill deleted successfully",
      data: skill[0],
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
