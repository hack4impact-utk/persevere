import { NextResponse } from "next/server";
import { z } from "zod";

import {
  addRequiredInterest,
  getRequiredInterests,
  removeRequiredInterest,
} from "@/services/opportunity-interests.service";
import { ConflictError, NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
import { validateAndParseId } from "@/utils/validate-id";

const bodySchema = z.object({
  interestId: z.number().int().positive(),
});

/**
 * GET /api/staff/calendar/events/[id]/interests
 * List required interests for a calendar event
 */
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
    const eventId = validateAndParseId(id);
    if (eventId === null) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const data = await getRequiredInterests(eventId);
    return NextResponse.json({ data });
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
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

/**
 * POST /api/staff/calendar/events/[id]/interests
 * Tag a required interest on a calendar event
 */
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
    const eventId = validateAndParseId(id);
    if (eventId === null) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const json = await request.json();
    const result = bodySchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    await addRequiredInterest(eventId, result.data.interestId);

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
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

/**
 * DELETE /api/staff/calendar/events/[id]/interests
 * Remove a required interest from a calendar event
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const eventId = validateAndParseId(id);
    if (eventId === null) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const json = await request.json();
    const result = bodySchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    await removeRequiredInterest(eventId, result.data.interestId);

    return NextResponse.json({ message: "Interest removed successfully" });
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
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
