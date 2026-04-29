import { and, eq } from "drizzle-orm";

import db from "@/db";
import { skills } from "@/db/schema";
import { opportunityRequiredSkills } from "@/db/schema/opportunities";
import {
  assertJunctionAbsent,
  deleteJunctionRow,
  requireOpportunity,
  requireSkill,
} from "@/services/shared/entity-checks";

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
  await assertJunctionAbsent(
    opportunityRequiredSkills,
    and(
      eq(opportunityRequiredSkills.opportunityId, eventId),
      eq(opportunityRequiredSkills.skillId, skillId),
    ),
    "Skill already required for this opportunity",
  );
  await db
    .insert(opportunityRequiredSkills)
    .values({ opportunityId: eventId, skillId });
}

export async function removeRequiredSkill(
  eventId: number,
  skillId: number,
): Promise<void> {
  await requireOpportunity(eventId);
  await deleteJunctionRow(
    opportunityRequiredSkills,
    and(
      eq(opportunityRequiredSkills.opportunityId, eventId),
      eq(opportunityRequiredSkills.skillId, skillId),
    ),
    "Skill assignment not found",
  );
}
