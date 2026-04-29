import { NextResponse } from "next/server";
import { z } from "zod";

import { opportunityStatusSchema } from "@/lib/status-enums";
import {
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/services/calendar-events.service";
import { requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

const eventUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  maxVolunteers: z.number().int().positive().optional(),
  status: opportunityStatusSchema.optional(),
  categoryId: z.number().int().positive().nullable().optional(),
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
    await requireStaffAuth();

    const { id } = await params;
    const eventId = validateAndParseId(id);

    if (eventId === null) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const parsed = await parseBodyOrError(request, eventUpdateSchema);
    if ("response" in parsed) return parsed.response;
    const data = parsed.data;
    const calendarEvent = await updateCalendarEvent(eventId, {
      title: data.title,
      description: data.description,
      location: data.location,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      maxVolunteers: data.maxVolunteers,
      status: data.status,
      categoryId: data.categoryId,
    });

    return NextResponse.json({
      message: "Event updated successfully",
      data: calendarEvent,
    });
  } catch (error) {
    return handleRouteError(error);
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
    await requireStaffAuth();

    const { id } = await params;
    const eventId = validateAndParseId(id);

    if (eventId === null) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    await deleteCalendarEvent(eventId);

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    return handleRouteError(error);
  }
}
