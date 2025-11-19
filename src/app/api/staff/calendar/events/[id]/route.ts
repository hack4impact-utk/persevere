import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import { opportunities } from "@/db/schema";
import { requireAuth } from "@/utils/auth";
import handleError from "@/utils/handle-error";

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
 * Validates and parses an event ID from a string parameter.
 * Returns null if the ID is invalid (not a positive integer).
 */
function validateAndParseId(id: string): number | null {
  if (!/^\d+$/.test(id)) {
    return null;
  }

  const parsed = Number.parseInt(id, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

/**
 * PUT /api/staff/calendar/events/[id]
 * Update an existing calendar event (opportunity)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Require staff or admin role
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const eventId = validateAndParseId(id);

    if (eventId === null) {
      return NextResponse.json(
        { message: "Invalid event ID" },
        { status: 400 },
      );
    }

    const json = await request.json();

    // Validate the request body
    const result = eventUpdateSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const data = result.data;

    // Check if event exists
    const existingEvent = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, eventId));

    if (existingEvent.length === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Validate date range if both dates are provided
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      if (endDate <= startDate) {
        return NextResponse.json(
          { message: "End date must be after start date" },
          { status: 400 },
        );
      }
    } else if (data.startDate) {
      // If only start date is provided, validate against existing end date
      const startDate = new Date(data.startDate);
      if (startDate >= existingEvent[0].endDate) {
        return NextResponse.json(
          { message: "Start date must be before end date" },
          { status: 400 },
        );
      }
    } else if (data.endDate) {
      // If only end date is provided, validate against existing start date
      const endDate = new Date(data.endDate);
      if (endDate <= existingEvent[0].startDate) {
        return NextResponse.json(
          { message: "End date must be after start date" },
          { status: 400 },
        );
      }
    }

    // Build update object
    const updateData: {
      title?: string;
      description?: string;
      location?: string;
      startDate?: Date;
      endDate?: Date;
      maxVolunteers?: number | null;
      status?: "open" | "full" | "completed" | "canceled";
      updatedAt?: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.maxVolunteers !== undefined)
      updateData.maxVolunteers = data.maxVolunteers;
    if (data.status !== undefined) updateData.status = data.status;

    // Update the opportunity
    const updatedEvent = await db
      .update(opportunities)
      .set(updateData)
      .where(eq(opportunities.id, eventId))
      .returning();

    // Transform to FullCalendar format
    const calendarEvent = {
      id: updatedEvent[0].id.toString(),
      title: updatedEvent[0].title,
      description: updatedEvent[0].description,
      location: updatedEvent[0].location,
      start: updatedEvent[0].startDate.toISOString(),
      end: updatedEvent[0].endDate.toISOString(),
      extendedProps: {
        maxVolunteers: updatedEvent[0].maxVolunteers,
        status: updatedEvent[0].status,
        createdById: updatedEvent[0].createdById,
        isRecurring: updatedEvent[0].isRecurring,
        recurrencePattern: updatedEvent[0].recurrencePattern,
      },
    };

    return NextResponse.json({
      message: "Event updated successfully",
      data: calendarEvent,
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

/**
 * DELETE /api/staff/calendar/events/[id]
 * Delete a calendar event (opportunity)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Require staff or admin role
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const eventId = validateAndParseId(id);

    if (eventId === null) {
      return NextResponse.json(
        { message: "Invalid event ID" },
        { status: 400 },
      );
    }

    // Check if event exists
    const existingEvent = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, eventId));

    if (existingEvent.length === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Delete the opportunity
    await db.delete(opportunities).where(eq(opportunities.id, eventId));

    return NextResponse.json({
      message: "Event deleted successfully",
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
