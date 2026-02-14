import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { volunteers, volunteerSkills } from "@/db/schema";
import handleError from "@/utils/handle-error";
import { requireAuth } from "@/utils/server/auth";

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
    const volunteerId = Number.parseInt(id, 10);
    const skillId = Number.parseInt(skillIdParam, 10);

    if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
      return NextResponse.json(
        { message: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(skillId) || skillId <= 0) {
      return NextResponse.json(
        { message: "Invalid skill ID" },
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

    // Check if assignment exists
    const existing = await db
      .select()
      .from(volunteerSkills)
      .where(
        and(
          eq(volunteerSkills.volunteerId, volunteerId),
          eq(volunteerSkills.skillId, skillId),
        ),
      );

    if (existing.length === 0) {
      return NextResponse.json(
        { message: "Skill assignment not found" },
        { status: 404 },
      );
    }

    // Remove the skill assignment
    await db
      .delete(volunteerSkills)
      .where(
        and(
          eq(volunteerSkills.volunteerId, volunteerId),
          eq(volunteerSkills.skillId, skillId),
        ),
      );

    return NextResponse.json({
      message: "Skill removed from volunteer successfully",
      data: { volunteerId, skillId },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
