import { and, eq, gte, inArray, lt, lte } from "drizzle-orm";

import db from "@/db";
import { eventCategories, opportunities } from "@/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/utils/errors";

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
    categoryId: number | null;
    categoryName: string | null;
  };
};

export type RecurrencePattern = {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  endDate?: string;
  count?: number;
};

function toCalendarEvent(
  row: typeof opportunities.$inferSelect,
  categoryName: string | null = null,
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
      categoryId: row.categoryId ?? null,
      categoryName,
    },
  };
}

function computeOccurrences(
  start: Date,
  end: Date,
  pattern: RecurrencePattern,
): { startDate: Date; endDate: Date }[] {
  const durationMs = end.getTime() - start.getTime();
  const occurrences: { startDate: Date; endDate: Date }[] = [];

  let current = new Date(start);
  const patternEndDate = pattern.endDate ? new Date(pattern.endDate) : null;
  const MAX_OCCURRENCES = 365;
  const maxCount = Math.min(pattern.count ?? MAX_OCCURRENCES, MAX_OCCURRENCES);

  while (occurrences.length < maxCount) {
    if (patternEndDate && current >= patternEndDate) break;

    occurrences.push({
      startDate: new Date(current),
      endDate: new Date(current.getTime() + durationMs),
    });

    // Advance by interval × frequency
    const next = new Date(current);
    switch (pattern.frequency) {
      case "daily": {
        next.setDate(next.getDate() + pattern.interval);
        break;
      }
      case "weekly": {
        next.setDate(next.getDate() + pattern.interval * 7);
        break;
      }
      case "monthly": {
        next.setMonth(next.getMonth() + pattern.interval);
        break;
      }
    }
    current = next;
  }

  return occurrences;
}

async function autoCompleteExpiredEvents(): Promise<void> {
  await db
    .update(opportunities)
    .set({ status: "completed", updatedAt: new Date() })
    .where(
      and(
        inArray(opportunities.status, ["open", "full"]),
        lt(opportunities.endDate, new Date()),
      ),
    );
}

export async function listCalendarEvents(
  startDate?: Date,
  endDate?: Date,
  statusFilter?: "open" | "full" | "completed" | "canceled",
): Promise<CalendarEvent[]> {
  await autoCompleteExpiredEvents();
  const whereClauses = [];
  if (statusFilter) whereClauses.push(eq(opportunities.status, statusFilter));
  if (startDate) whereClauses.push(gte(opportunities.endDate, startDate));
  if (endDate) whereClauses.push(lte(opportunities.startDate, endDate));

  const rows = await (whereClauses.length > 0
    ? db
        .select({
          opportunity: opportunities,
          categoryName: eventCategories.name,
        })
        .from(opportunities)
        .leftJoin(
          eventCategories,
          eq(opportunities.categoryId, eventCategories.id),
        )
        .where(and(...whereClauses))
    : db
        .select({
          opportunity: opportunities,
          categoryName: eventCategories.name,
        })
        .from(opportunities)
        .leftJoin(
          eventCategories,
          eq(opportunities.categoryId, eventCategories.id),
        ));

  return rows.map((r) =>
    toCalendarEvent(r.opportunity, r.categoryName ?? null),
  );
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
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  categoryId?: number;
}): Promise<CalendarEvent[]> {
  const occurrences =
    data.isRecurring && data.recurrencePattern
      ? computeOccurrences(data.startDate, data.endDate, data.recurrencePattern)
      : [{ startDate: data.startDate, endDate: data.endDate }];

  // Batch duplicate check: same title + any of the start dates
  const startDates = occurrences.map((occ) => occ.startDate);
  const duplicates = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(
      and(
        eq(opportunities.title, data.title),
        inArray(opportunities.startDate, startDates),
      ),
    )
    .limit(1);
  if (duplicates.length > 0) {
    throw new ConflictError(
      `An event named "${data.title}" already exists at that start time`,
    );
  }

  // Resolve category name once for the response
  let categoryName: string | null = null;
  if (data.categoryId) {
    const catRows = await db
      .select({ name: eventCategories.name })
      .from(eventCategories)
      .where(eq(eventCategories.id, data.categoryId));
    categoryName = catRows[0]?.name ?? null;
  }

  const values = occurrences.map((occ) => ({
    title: data.title,
    description: data.description ?? "",
    location: data.location ?? "",
    startDate: occ.startDate,
    endDate: occ.endDate,
    createdById: data.createdById,
    status: data.status ?? ("open" as const),
    maxVolunteers: data.maxVolunteers,
    isRecurring: data.isRecurring ?? false,
    recurrencePattern: data.recurrencePattern ?? null,
    categoryId: data.categoryId ?? null,
  }));

  const rows = await db.insert(opportunities).values(values).returning();

  if (!rows || rows.length === 0) {
    throw new Error("Failed to create event: no data returned from database");
  }

  return rows.map((r) => toCalendarEvent(r, categoryName));
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
    categoryId?: number | null;
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
    categoryId?: number | null;
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
  if ("categoryId" in data) updateData.categoryId = data.categoryId ?? null;

  const rows = await db
    .update(opportunities)
    .set(updateData)
    .where(eq(opportunities.id, id))
    .returning();

  // Resolve category name for the response
  let categoryName: string | null = null;
  const effectiveCategoryId = rows[0].categoryId;
  if (effectiveCategoryId) {
    const catRows = await db
      .select({ name: eventCategories.name })
      .from(eventCategories)
      .where(eq(eventCategories.id, effectiveCategoryId));
    categoryName = catRows[0]?.name ?? null;
  }

  return toCalendarEvent(rows[0], categoryName);
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
