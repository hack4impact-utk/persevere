import { NextResponse } from "next/server";
import { z } from "zod";

import {
  type OpportunityStatus,
  opportunityStatusSchema,
} from "@/lib/status-enums";
import {
  createCalendarEvent,
  listCalendarEvents,
} from "@/services/calendar-events.service";
import { requireAuth, requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";

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
  status: opportunityStatusSchema.optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: recurrencePatternSchema.optional(),
  categoryId: z.number().int().positive().optional(),
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

    const statusFilter: OpportunityStatus[] | undefined =
      session.user.role === "volunteer" ? ["open", "full"] : undefined;
    const calendarEvents = await listCalendarEvents(
      startDate,
      endDate,
      statusFilter,
    );

    return NextResponse.json({ data: calendarEvents });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/staff/calendar/events
 * Create a new calendar event (opportunity)
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireStaffAuth();

    const parsed = await parseBodyOrError(request, eventCreateSchema);
    if ("response" in parsed) return parsed.response;

    const data = parsed.data;
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
      categoryId: data.categoryId,
    });

    return NextResponse.json(
      { message: "Event created successfully", data: calendarEvents },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
