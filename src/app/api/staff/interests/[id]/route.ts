import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import { interests, volunteerInterests } from "@/db/schema";
import { requireAuth } from "@/utils/auth";
import handleError from "@/utils/handle-error";

const interestUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
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
    const interestId = Number.parseInt(id, 10);

    if (!Number.isInteger(interestId) || interestId <= 0) {
      return NextResponse.json(
        { message: "Invalid interest ID" },
        { status: 400 },
      );
    }

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

    return NextResponse.json({ data: interest[0] });
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
    const interestId = Number.parseInt(id, 10);

    if (!Number.isInteger(interestId) || interestId <= 0) {
      return NextResponse.json(
        { message: "Invalid interest ID" },
        { status: 400 },
      );
    }

    const json = await request.json();
    const result = interestUpdateSchema.safeParse(json);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const data = result.data;

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

    // Check if updating name and if it conflicts with existing
    if (data.name && data.name !== interest[0].name) {
      const existing = await db
        .select()
        .from(interests)
        .where(eq(interests.name, data.name));

      if (existing.length > 0) {
        return NextResponse.json(
          { message: "An interest with this name already exists" },
          { status: 400 },
        );
      }
    }

    const updateData: {
      name?: string;
      description?: string;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(interests)
        .set(updateData)
        .where(eq(interests.id, interestId));
    }

    const updatedInterest = await db
      .select()
      .from(interests)
      .where(eq(interests.id, interestId));

    return NextResponse.json({
      message: "Interest updated successfully",
      data: updatedInterest[0],
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
    const interestId = Number.parseInt(id, 10);

    if (!Number.isInteger(interestId) || interestId <= 0) {
      return NextResponse.json(
        { message: "Invalid interest ID" },
        { status: 400 },
      );
    }

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

    // Check if interest is in use by any volunteers
    const usageCount = await db
      .select()
      .from(volunteerInterests)
      .where(eq(volunteerInterests.interestId, interestId));

    if (usageCount.length > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete interest: it is assigned to ${usageCount.length} volunteer(s)`,
        },
        { status: 400 },
      );
    }

    await db.delete(interests).where(eq(interests.id, interestId));

    return NextResponse.json({
      message: "Interest deleted successfully",
      data: interest[0],
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
