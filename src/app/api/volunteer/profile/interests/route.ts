import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  assignInterest,
  removeInterest,
} from "@/services/volunteer-interests.service";
import { ConflictError, NotFoundError } from "@/utils/errors";
import { AuthError, requireAuth } from "@/utils/server/auth";

const assignInterestSchema = z.object({
  interestId: z.number().int().positive(),
});

const removeInterestSchema = z.object({
  interestId: z.number().int().positive(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");

    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validation = assignInterestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { interestId } = validation.data;

    await assignInterest(volunteerId, interestId);

    return NextResponse.json(
      { message: "Interest added successfully" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }

    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("[POST /api/volunteer/profile/interests] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");

    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validation = removeInterestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { interestId } = validation.data;

    await removeInterest(volunteerId, interestId);

    return NextResponse.json(
      { message: "Interest removed successfully" },
      { status: 200 },
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

    console.error("[DELETE /api/volunteer/profile/interests] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
