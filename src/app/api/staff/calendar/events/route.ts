import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createCalendarEvent,
  listCalendarEvents,
} from "@/services/calendar-events.service";
import { ConflictError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

const recurrencePatternSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  interval: z.number().int().positive(),
  endDate: z.string().optional(),
  count: z.number().int().positive().optional(),
});

const eventCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  maxVolunteers: z.number().int().positive().optional(),
  status: z.enum(["open", "full", "completed", "canceled"]).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: recurrencePatternSchema.optional(),
});

/**
 * GET /api/staff/calendar/events
 * Fetch all calendar events (opportunities) with optional date range filtering
 * Allows staff, admin, and volunteers to view events
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin", "volunteer"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startStr) {
      startDate = new Date(startStr);
      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date parameter" },
          { status: 400 },
        );
      }
    }
    if (endStr) {
      endDate = new Date(endStr);
      if (Number.isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date parameter" },
          { status: 400 },
        );
      }
    }

    const calendarEvents = await listCalendarEvents(startDate, endDate);

    return NextResponse.json({ data: calendarEvents });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

/**
 * POST /api/staff/calendar/events
 * Create a new calendar event (opportunity)
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await request.json();
    const result = eventCreateSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const data = result.data;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

    const calendarEvents = await createCalendarEvent({
      title: data.title,
      description: data.description,
      location: data.location,
      startDate,
      endDate,
      createdById: Number.parseInt(session.user.id, 10),
      status: data.status,
      maxVolunteers: data.maxVolunteers,
      isRecurring: data.isRecurring,
      recurrencePattern: data.recurrencePattern,
    });

    return NextResponse.json(
      { message: "Event created successfully", data: calendarEvents },
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
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
