import { and, eq, ne } from "drizzle-orm";

import db from "@/db";
import { eventCategories } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type EventCategory = typeof eventCategories.$inferSelect;

export async function listActiveEventCategories(): Promise<EventCategory[]> {
  return db
    .select()
    .from(eventCategories)
    .where(eq(eventCategories.isActive, true))
    .orderBy(eventCategories.name);
}

export async function listAllEventCategories(): Promise<EventCategory[]> {
  return db.select().from(eventCategories).orderBy(eventCategories.name);
}

export async function createEventCategory(data: {
  name: string;
}): Promise<EventCategory> {
  const existing = await db
    .select()
    .from(eventCategories)
    .where(eq(eventCategories.name, data.name));

  if (existing.length > 0) {
    throw new ConflictError("An event category with this name already exists");
  }

  const rows = await db
    .insert(eventCategories)
    .values({ name: data.name })
    .returning();

  return rows[0];
}

export async function updateEventCategory(
  id: number,
  data: { name?: string; isActive?: boolean },
): Promise<EventCategory> {
  const rows = await db
    .select()
    .from(eventCategories)
    .where(eq(eventCategories.id, id));

  if (rows.length === 0) {
    throw new NotFoundError("Event category not found");
  }

  if (data.name !== undefined && data.name !== rows[0].name) {
    const existing = await db
      .select()
      .from(eventCategories)
      .where(
        and(eq(eventCategories.name, data.name), ne(eventCategories.id, id)),
      );

    if (existing.length > 0) {
      throw new ConflictError(
        "An event category with this name already exists",
      );
    }
  }

  const updateData: { name?: string; isActive?: boolean } = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(eventCategories)
      .set(updateData)
      .where(eq(eventCategories.id, id));
  }

  const updated = await db
    .select()
    .from(eventCategories)
    .where(eq(eventCategories.id, id));

  return updated[0];
}

export async function deleteEventCategory(id: number): Promise<void> {
  const rows = await db
    .select()
    .from(eventCategories)
    .where(eq(eventCategories.id, id));

  if (rows.length === 0) {
    throw new NotFoundError("Event category not found");
  }

  await db
    .update(eventCategories)
    .set({ isActive: false })
    .where(eq(eventCategories.id, id));
}
