import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import { skills, volunteers, volunteerSkills } from "@/db/schema";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

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
    const volunteerId = Number.parseInt(id, 10);

    if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
      return NextResponse.json(
        { message: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    // Check if volunteer exists
    const volunteer = await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.id, volunteerId));

    if (volunteer.length === 0) {
      return NextResponse.json(
        { message: "Volunteer not found" },
        { status: 404 },
      );
    }

    // Fetch volunteer's skills
    const volunteerSkillsData = await db
      .select({
        skillId: volunteerSkills.skillId,
        skillName: skills.name,
        skillDescription: skills.description,
        skillCategory: skills.category,
        proficiencyLevel: volunteerSkills.level,
      })
      .from(volunteerSkills)
      .leftJoin(skills, eq(volunteerSkills.skillId, skills.id))
      .where(eq(volunteerSkills.volunteerId, volunteerId));

    return NextResponse.json({ data: volunteerSkillsData });
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
    const volunteerId = Number.parseInt(id, 10);

    if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
      return NextResponse.json(
        { message: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const json = await request.json();
    const result = addSkillSchema.safeParse(json);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const { skillId, level } = result.data;

    // Check if volunteer exists
    const volunteer = await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.id, volunteerId));

    if (volunteer.length === 0) {
      return NextResponse.json(
        { message: "Volunteer not found" },
        { status: 404 },
      );
    }

    // Check if skill exists
    const skill = await db.select().from(skills).where(eq(skills.id, skillId));

    if (skill.length === 0) {
      return NextResponse.json({ message: "Skill not found" }, { status: 404 });
    }

    // Check if already assigned
    const existing = await db
      .select()
      .from(volunteerSkills)
      .where(
        and(
          eq(volunteerSkills.volunteerId, volunteerId),
          eq(volunteerSkills.skillId, skillId),
        ),
      );

    if (existing.length > 0) {
      // Update the level instead of failing
      await db
        .update(volunteerSkills)
        .set({ level })
        .where(
          and(
            eq(volunteerSkills.volunteerId, volunteerId),
            eq(volunteerSkills.skillId, skillId),
          ),
        );

      return NextResponse.json({
        message: "Skill level updated successfully",
        data: { volunteerId, skillId, level },
      });
    }

    // Add the skill assignment
    await db.insert(volunteerSkills).values({
      volunteerId,
      skillId,
      level,
    });

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
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
