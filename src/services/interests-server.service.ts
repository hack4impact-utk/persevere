import { eq } from "drizzle-orm";

import db from "@/db";
import { interests, volunteerInterests } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type Interest = typeof interests.$inferSelect;

export async function listInterests(): Promise<Interest[]> {
  return db.select().from(interests).orderBy(interests.name);
}

export async function createInterest(data: {
  name: string;
  description?: string;
}): Promise<Interest> {
  const existing = await db
    .select()
    .from(interests)
    .where(eq(interests.name, data.name));

  if (existing.length > 0) {
    throw new ConflictError("An interest with this name already exists");
  }

  const rows = await db
    .insert(interests)
    .values({ name: data.name, description: data.description })
    .returning();

  return rows[0];
}

export async function getInterestById(id: number): Promise<Interest> {
  const rows = await db.select().from(interests).where(eq(interests.id, id));

  if (rows.length === 0) {
    throw new NotFoundError("Interest not found");
  }

  return rows[0];
}

export async function updateInterest(
  id: number,
  data: { name?: string; description?: string },
): Promise<Interest> {
  const rows = await db.select().from(interests).where(eq(interests.id, id));

  if (rows.length === 0) {
    throw new NotFoundError("Interest not found");
  }

  if (data.name && data.name !== rows[0].name) {
    const existing = await db
      .select()
      .from(interests)
      .where(eq(interests.name, data.name));

    if (existing.length > 0) {
      throw new ConflictError("An interest with this name already exists");
    }
  }

  const updateData: { name?: string; description?: string } = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;

  if (Object.keys(updateData).length > 0) {
    await db.update(interests).set(updateData).where(eq(interests.id, id));
  }

  const updated = await db.select().from(interests).where(eq(interests.id, id));
  return updated[0];
}

export async function deleteInterest(id: number): Promise<void> {
  const rows = await db.select().from(interests).where(eq(interests.id, id));

  if (rows.length === 0) {
    throw new NotFoundError("Interest not found");
  }

  const usageCount = await db
    .select()
    .from(volunteerInterests)
    .where(eq(volunteerInterests.interestId, id));

  if (usageCount.length > 0) {
    throw new ConflictError(
      `Cannot delete interest: it is assigned to ${usageCount.length} volunteer(s)`,
    );
  }

  await db.delete(interests).where(eq(interests.id, id));
}
