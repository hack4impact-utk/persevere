import { and, eq, gte, lte } from "drizzle-orm";

import db from "@/db";
import { opportunities } from "@/db/schema";
import { NotFoundError, ValidationError } from "@/utils/errors";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  extendedProps: {
    maxVolunteers: number | null;
    status: "open" | "full" | "completed" | "canceled";
    createdById: number | null;
    isRecurring: boolean;
    recurrencePattern: unknown;
  };
};

function toCalendarEvent(
  row: typeof opportunities.$inferSelect,
): CalendarEvent {
  return {
    id: row.id.toString(),
    title: row.title,
    description: row.description,
    location: row.location,
    start: row.startDate.toISOString(),
    end: row.endDate.toISOString(),
    extendedProps: {
      maxVolunteers: row.maxVolunteers,
      status: row.status,
      createdById: row.createdById,
      isRecurring: row.isRecurring,
      recurrencePattern: row.recurrencePattern,
    },
  };
}

export async function listCalendarEvents(
  startDate?: Date,
  endDate?: Date,
): Promise<CalendarEvent[]> {
  const whereClauses = [];
  if (startDate) whereClauses.push(gte(opportunities.startDate, startDate));
  if (endDate) whereClauses.push(lte(opportunities.startDate, endDate));

  const events = await (whereClauses.length > 0
    ? db
        .select()
        .from(opportunities)
        .where(and(...whereClauses))
    : db.select().from(opportunities));

  return events.map((e) => toCalendarEvent(e));
}

export async function createCalendarEvent(data: {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  maxVolunteers?: number;
  status?: "open" | "full" | "completed" | "canceled";
  createdById: number;
}): Promise<CalendarEvent> {
  const rows = await db
    .insert(opportunities)
    .values({
      title: data.title,
      description: data.description || "",
      location: data.location || "",
      startDate: data.startDate,
      endDate: data.endDate,
      createdById: data.createdById,
      status: data.status || "open",
      maxVolunteers: data.maxVolunteers,
      isRecurring: false,
    })
    .returning();

  if (!rows || rows.length === 0 || !rows[0]) {
    throw new Error("Failed to create event: no data returned from database");
  }

  return toCalendarEvent(rows[0]);
}

export async function updateCalendarEvent(
  id: number,
  data: {
    title?: string;
    description?: string;
    location?: string;
    startDate?: Date;
    endDate?: Date;
    maxVolunteers?: number;
    status?: "open" | "full" | "completed" | "canceled";
  },
): Promise<CalendarEvent> {
  const existing = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id));

  if (existing.length === 0) {
    throw new NotFoundError("Event not found");
  }

  const effectiveStart = data.startDate ?? existing[0].startDate;
  const effectiveEnd = data.endDate ?? existing[0].endDate;
  if (effectiveEnd <= effectiveStart) {
    throw new ValidationError("End date must be after start date");
  }

  const updateData: {
    title?: string;
    description?: string;
    location?: string;
    startDate?: Date;
    endDate?: Date;
    maxVolunteers?: number | null;
    status?: "open" | "full" | "completed" | "canceled";
    updatedAt?: Date;
  } = { updatedAt: new Date() };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.maxVolunteers !== undefined)
    updateData.maxVolunteers = data.maxVolunteers;
  if (data.status !== undefined) updateData.status = data.status;

  const rows = await db
    .update(opportunities)
    .set(updateData)
    .where(eq(opportunities.id, id))
    .returning();

  return toCalendarEvent(rows[0]);
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  const existing = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id));

  if (existing.length === 0) {
    throw new NotFoundError("Event not found");
  }

  await db.delete(opportunities).where(eq(opportunities.id, id));
}
