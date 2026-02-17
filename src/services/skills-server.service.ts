import { eq } from "drizzle-orm";

import db from "@/db";
import { skills, volunteerSkills } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type Skill = typeof skills.$inferSelect;

export async function listSkills(): Promise<Skill[]> {
  return db.select().from(skills).orderBy(skills.name);
}

export async function createSkill(data: {
  name: string;
  description?: string;
  category?: string;
}): Promise<Skill> {
  const existing = await db
    .select()
    .from(skills)
    .where(eq(skills.name, data.name));

  if (existing.length > 0) {
    throw new ConflictError("A skill with this name already exists");
  }

  const rows = await db
    .insert(skills)
    .values({
      name: data.name,
      description: data.description,
      category: data.category,
    })
    .returning();

  return rows[0];
}

export async function getSkillById(id: number): Promise<Skill> {
  const rows = await db.select().from(skills).where(eq(skills.id, id));

  if (rows.length === 0) {
    throw new NotFoundError("Skill not found");
  }

  return rows[0];
}

export async function updateSkill(
  id: number,
  data: { name?: string; description?: string; category?: string },
): Promise<Skill> {
  const rows = await db.select().from(skills).where(eq(skills.id, id));

  if (rows.length === 0) {
    throw new NotFoundError("Skill not found");
  }

  if (data.name && data.name !== rows[0].name) {
    const existing = await db
      .select()
      .from(skills)
      .where(eq(skills.name, data.name));

    if (existing.length > 0) {
      throw new ConflictError("A skill with this name already exists");
    }
  }

  const updateData: { name?: string; description?: string; category?: string } =
    {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;

  if (Object.keys(updateData).length > 0) {
    await db.update(skills).set(updateData).where(eq(skills.id, id));
  }

  const updated = await db.select().from(skills).where(eq(skills.id, id));
  return updated[0];
}

export async function deleteSkill(id: number): Promise<void> {
  const rows = await db.select().from(skills).where(eq(skills.id, id));

  if (rows.length === 0) {
    throw new NotFoundError("Skill not found");
  }

  const usageCount = await db
    .select()
    .from(volunteerSkills)
    .where(eq(volunteerSkills.skillId, id));

  if (usageCount.length > 0) {
    throw new ConflictError(
      `Cannot delete skill: it is assigned to ${usageCount.length} volunteer(s)`,
    );
  }

  await db.delete(skills).where(eq(skills.id, id));
}
