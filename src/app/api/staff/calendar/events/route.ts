import { and, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import { opportunities } from "@/db/schema";
import handleError from "@/utils/handle-error";
import { requireAuth } from "@/utils/server/auth";

const eventCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  maxVolunteers: z.number().int().positive().optional(),
  status: z.enum(["open", "full", "completed", "canceled"]).optional(),
});

/**
 * GET /api/staff/calendar/events
 * Fetch all calendar events (opportunities) with optional date range filtering
 * Allows staff, admin, and volunteers to view events
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Require authenticated user (staff, admin, or volunteer)
    const session = await requireAuth();
    if (!["staff", "admin", "volunteer"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    // Build query with optional date range filtering
    const whereClauses = [];
    if (startStr) {
      const startDate = new Date(startStr);
      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json(
          { message: "Invalid start date parameter" },
          { status: 400 },
        );
      }
      whereClauses.push(gte(opportunities.startDate, startDate));
    }
    if (endStr) {
      const endDate = new Date(endStr);
      if (Number.isNaN(endDate.getTime())) {
        return NextResponse.json(
          { message: "Invalid end date parameter" },
          { status: 400 },
        );
      }
      whereClauses.push(lte(opportunities.startDate, endDate));
    }

    const events = await (whereClauses.length > 0
      ? db
          .select()
          .from(opportunities)
          .where(and(...whereClauses))
      : db.select().from(opportunities));

    // Transform events to FullCalendar format
    const calendarEvents = events.map((event) => ({
      id: event.id.toString(),
      title: event.title,
      description: event.description,
      location: event.location,
      start: event.startDate.toISOString(),
      end: event.endDate.toISOString(),
      extendedProps: {
        maxVolunteers: event.maxVolunteers,
        status: event.status,
        createdById: event.createdById,
        isRecurring: event.isRecurring,
        recurrencePattern: event.recurrencePattern,
      },
    }));

    return NextResponse.json({ data: calendarEvents });
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
 * POST /api/staff/calendar/events
 * Create a new calendar event (opportunity)
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Require staff or admin role
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await request.json();

    // Validate the request body
    const result = eventCreateSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const data = result.data;

    // Validate that end date is after start date
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate <= startDate) {
      return NextResponse.json(
        { message: "End date must be after start date" },
        { status: 400 },
      );
    }

    // Create the opportunity
    const newEvent = await db
      .insert(opportunities)
      .values({
        title: data.title,
        description: data.description || "",
        location: data.location || "",
        startDate: startDate,
        endDate: endDate,
        createdById: Number.parseInt(session.user.id, 10),
        status: data.status || "open",
        maxVolunteers: data.maxVolunteers,
        isRecurring: false,
      })
      .returning();

    // Defensive check: ensure the insert returned a row
    if (!newEvent || newEvent.length === 0 || !newEvent[0]) {
      return NextResponse.json(
        { error: "Failed to create event: no data returned from database" },
        { status: 500 },
      );
    }

    // Transform to FullCalendar format
    const calendarEvent = {
      id: newEvent[0].id.toString(),
      title: newEvent[0].title,
      description: newEvent[0].description,
      location: newEvent[0].location,
      start: newEvent[0].startDate.toISOString(),
      end: newEvent[0].endDate.toISOString(),
      extendedProps: {
        maxVolunteers: newEvent[0].maxVolunteers,
        status: newEvent[0].status,
        createdById: newEvent[0].createdById,
        isRecurring: newEvent[0].isRecurring,
        recurrencePattern: newEvent[0].recurrencePattern,
      },
    };

    return NextResponse.json(
      { message: "Event created successfully", data: calendarEvent },
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
