import { and, eq } from "drizzle-orm";

import db from "@/db";
import { skills } from "@/db/schema";
import {
  opportunities,
  opportunityRequiredSkills,
} from "@/db/schema/opportunities";
import { ConflictError, NotFoundError } from "@/utils/errors";

async function requireEvent(eventId: number): Promise<void> {
  const [event] = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(eq(opportunities.id, eventId));
  if (!event) throw new NotFoundError("Calendar event not found");
}

export async function addRequiredSkill(
  eventId: number,
  skillId: number,
): Promise<void> {
  await requireEvent(eventId);
  const [skill] = await db
    .select({ id: skills.id })
    .from(skills)
    .where(eq(skills.id, skillId));
  if (!skill) throw new NotFoundError("Skill not found");
  const existing = await db
    .select()
    .from(opportunityRequiredSkills)
    .where(
      and(
        eq(opportunityRequiredSkills.opportunityId, eventId),
        eq(opportunityRequiredSkills.skillId, skillId),
      ),
    );
  if (existing.length > 0) {
    throw new ConflictError("Skill already required for this opportunity");
  }
  await db
    .insert(opportunityRequiredSkills)
    .values({ opportunityId: eventId, skillId });
}

export async function removeRequiredSkill(
  eventId: number,
  skillId: number,
): Promise<void> {
  await requireEvent(eventId);
  const deleted = await db
    .delete(opportunityRequiredSkills)
    .where(
      and(
        eq(opportunityRequiredSkills.opportunityId, eventId),
        eq(opportunityRequiredSkills.skillId, skillId),
      ),
    )
    .returning();
  if (deleted.length === 0)
    throw new NotFoundError("Skill assignment not found");
}
