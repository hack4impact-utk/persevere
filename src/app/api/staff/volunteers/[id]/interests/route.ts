import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import { interests, volunteerInterests, volunteers } from "@/db/schema";
import handleError from "@/utils/handle-error";
import { requireAuth } from "@/utils/server/auth";

const addInterestSchema = z.object({
  interestId: z
    .number()
    .int()
    .positive("Interest ID must be a positive integer"),
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

    // Fetch volunteer's interests
    const volunteerInterestsData = await db
      .select({
        interestId: volunteerInterests.interestId,
        interestName: interests.name,
        interestDescription: interests.description,
      })
      .from(volunteerInterests)
      .leftJoin(interests, eq(volunteerInterests.interestId, interests.id))
      .where(eq(volunteerInterests.volunteerId, volunteerId));

    return NextResponse.json({ data: volunteerInterestsData });
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
    const result = addInterestSchema.safeParse(json);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const { interestId } = result.data;

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

    // Check if interest exists
    const interest = await db
      .select()
      .from(interests)
      .where(eq(interests.id, interestId));

    if (interest.length === 0) {
      return NextResponse.json(
        { message: "Interest not found" },
        { status: 404 },
      );
    }

    // Check if already assigned
    const existing = await db
      .select()
      .from(volunteerInterests)
      .where(
        and(
          eq(volunteerInterests.volunteerId, volunteerId),
          eq(volunteerInterests.interestId, interestId),
        ),
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Interest is already assigned to this volunteer" },
        { status: 400 },
      );
    }

    // Add the interest assignment
    await db.insert(volunteerInterests).values({
      volunteerId,
      interestId,
    });

    return NextResponse.json(
      {
        message: "Interest assigned successfully",
        data: { volunteerId, interestId },
      },
      { status: 201 },
    );
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
