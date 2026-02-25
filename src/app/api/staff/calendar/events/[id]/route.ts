import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/services/calendar-events.service";
import { NotFoundError, ValidationError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
import { validateAndParseId } from "@/utils/validate-id";

const eventUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  maxVolunteers: z.number().int().positive().optional(),
  status: z.enum(["open", "full", "completed", "canceled"]).optional(),
});

/**
 * PUT /api/staff/calendar/events/[id]
 * Update an existing calendar event (opportunity)
 */
export async function PUT(
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
    const result = eventUpdateSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const data = result.data;
    const calendarEvent = await updateCalendarEvent(eventId, {
      title: data.title,
      description: data.description,
      location: data.location,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      maxVolunteers: data.maxVolunteers,
      status: data.status,
    });

    return NextResponse.json({
      message: "Event updated successfully",
      data: calendarEvent,
    });
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
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

/**
 * DELETE /api/staff/calendar/events/[id]
 * Delete a calendar event (opportunity)
 */
export async function DELETE(
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

    await deleteCalendarEvent(eventId);

    return NextResponse.json({ message: "Event deleted successfully" });
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
