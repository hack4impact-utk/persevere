import { and, eq, ne } from "drizzle-orm";

import db from "@/db";
import { volunteerTypes } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type VolunteerType = typeof volunteerTypes.$inferSelect;

export async function listActiveVolunteerTypes(): Promise<VolunteerType[]> {
  return db
    .select()
    .from(volunteerTypes)
    .where(eq(volunteerTypes.isActive, true))
    .orderBy(volunteerTypes.name);
}

export async function listAllVolunteerTypes(): Promise<VolunteerType[]> {
  return db.select().from(volunteerTypes).orderBy(volunteerTypes.name);
}

export async function createVolunteerType(data: {
  name: string;
}): Promise<VolunteerType> {
  const existing = await db
    .select()
    .from(volunteerTypes)
    .where(eq(volunteerTypes.name, data.name));

  if (existing.length > 0) {
    throw new ConflictError("A volunteer type with this name already exists");
  }

  const rows = await db
    .insert(volunteerTypes)
    .values({ name: data.name })
    .returning();

  return rows[0];
}

export async function updateVolunteerType(
  id: number,
  data: { name?: string; isActive?: boolean },
): Promise<VolunteerType> {
  const rows = await db
    .select()
    .from(volunteerTypes)
    .where(eq(volunteerTypes.id, id));

  if (rows.length === 0) {
    throw new NotFoundError("Volunteer type not found");
  }

  if (data.name !== undefined && data.name !== rows[0].name) {
    const existing = await db
      .select()
      .from(volunteerTypes)
      .where(
        and(eq(volunteerTypes.name, data.name), ne(volunteerTypes.id, id)),
      );

    if (existing.length > 0) {
      throw new ConflictError("A volunteer type with this name already exists");
    }
  }

  const updateData: { name?: string; isActive?: boolean } = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(volunteerTypes)
      .set(updateData)
      .where(eq(volunteerTypes.id, id));
  }

  const updated = await db
    .select()
    .from(volunteerTypes)
    .where(eq(volunteerTypes.id, id));

  return updated[0];
}

export async function deleteVolunteerType(id: number): Promise<void> {
  const rows = await db
    .select()
    .from(volunteerTypes)
    .where(eq(volunteerTypes.id, id));

  if (rows.length === 0) {
    throw new NotFoundError("Volunteer type not found");
  }

  await db
    .update(volunteerTypes)
    .set({ isActive: false })
    .where(eq(volunteerTypes.id, id));
}
