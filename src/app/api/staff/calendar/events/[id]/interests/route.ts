import { NextResponse } from "next/server";
import { z } from "zod";

import {
  addRequiredInterest,
  getRequiredInterests,
  removeRequiredInterest,
} from "@/services/opportunity-interests.service";
import { requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
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
    await requireStaffAuth();

    const { id } = await params;
    const eventId = validateAndParseId(id);
    if (eventId === null) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const data = await getRequiredInterests(eventId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
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
    await requireStaffAuth();

    const { id } = await params;
    const eventId = validateAndParseId(id);
    if (eventId === null) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const parsed = await parseBodyOrError(request, bodySchema);
    if ("response" in parsed) return parsed.response;

    await addRequiredInterest(eventId, parsed.data.interestId);

    return NextResponse.json(
      { message: "Interest added successfully" },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
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
    await requireStaffAuth();

    const { id } = await params;
    const eventId = validateAndParseId(id);
    if (eventId === null) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 },
      );
    }
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
    return handleRouteError(error);
  }
}
