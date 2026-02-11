import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { volunteerInterests, volunteers } from "@/db/schema";
import { requireAuth } from "@/utils/auth";
import handleError from "@/utils/handle-error";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; interestId: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, interestId: interestIdParam } = await params;
    const volunteerId = Number.parseInt(id, 10);
    const interestId = Number.parseInt(interestIdParam, 10);

    if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
      return NextResponse.json(
        { message: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(interestId) || interestId <= 0) {
      return NextResponse.json(
        { message: "Invalid interest ID" },
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
      .from(volunteerInterests)
      .where(
        and(
          eq(volunteerInterests.volunteerId, volunteerId),
          eq(volunteerInterests.interestId, interestId),
        ),
      );

    if (existing.length === 0) {
      return NextResponse.json(
        { message: "Interest assignment not found" },
        { status: 404 },
      );
    }

    // Remove the interest assignment
    await db
      .delete(volunteerInterests)
      .where(
        and(
          eq(volunteerInterests.volunteerId, volunteerId),
          eq(volunteerInterests.interestId, interestId),
        ),
      );

    return NextResponse.json({
      message: "Interest removed from volunteer successfully",
      data: { volunteerId, interestId },
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
