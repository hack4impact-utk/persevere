import { and, eq } from "drizzle-orm";

import db from "@/db";
import { skills } from "@/db/schema";
import { opportunityRequiredSkills } from "@/db/schema/opportunities";
import {
  requireOpportunity,
  requireSkill,
} from "@/services/shared/entity-checks";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type RequiredSkill = {
  skillId: number;
  skillName: string | null;
};

export async function getRequiredSkills(
  eventId: number,
): Promise<RequiredSkill[]> {
  await requireOpportunity(eventId);
  return db
    .select({
      skillId: opportunityRequiredSkills.skillId,
      skillName: skills.name,
    })
    .from(opportunityRequiredSkills)
    .leftJoin(skills, eq(opportunityRequiredSkills.skillId, skills.id))
    .where(eq(opportunityRequiredSkills.opportunityId, eventId));
}

export async function addRequiredSkill(
  eventId: number,
  skillId: number,
): Promise<void> {
  await requireOpportunity(eventId);
  await requireSkill(skillId);
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
  await requireOpportunity(eventId);
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
