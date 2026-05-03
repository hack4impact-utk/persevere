import { and, eq } from "drizzle-orm";

import db from "@/db";
import { skills, volunteerSkills } from "@/db/schema";
import {
  deleteJunctionRow,
  requireSkill,
  requireVolunteer,
} from "@/services/shared/entity-checks";

export type SkillDetail = {
  skillId: number;
  skillName: string | null;
  skillDescription: string | null;
  skillCategory: string | null;
  proficiencyLevel: "no_selection" | "beginner" | "intermediate" | "advanced";
};

export async function getVolunteerSkills(
  volunteerId: number,
): Promise<SkillDetail[]> {
  await requireVolunteer(volunteerId);

  return db
    .select({
      skillId: volunteerSkills.skillId,
      skillName: skills.name,
      skillDescription: skills.description,
      skillCategory: skills.category,
      proficiencyLevel: volunteerSkills.level,
    })
    .from(volunteerSkills)
    .leftJoin(skills, eq(volunteerSkills.skillId, skills.id))
    .where(eq(volunteerSkills.volunteerId, volunteerId));
}

export type AssignSkillResult = { updated: true } | { created: true };

export async function assignSkill(
  volunteerId: number,
  skillId: number,
  level:
    | "no_selection"
    | "beginner"
    | "intermediate"
    | "advanced" = "no_selection",
): Promise<AssignSkillResult> {
  await requireVolunteer(volunteerId);
  await requireSkill(skillId);

  const existing = await db
    .select()
    .from(volunteerSkills)
    .where(
      and(
        eq(volunteerSkills.volunteerId, volunteerId),
        eq(volunteerSkills.skillId, skillId),
      ),
    );

  if (existing.length > 0) {
    await db
      .update(volunteerSkills)
      .set({ level })
      .where(
        and(
          eq(volunteerSkills.volunteerId, volunteerId),
          eq(volunteerSkills.skillId, skillId),
        ),
      );
    return { updated: true };
  }

  await db.insert(volunteerSkills).values({ volunteerId, skillId, level });
  return { created: true };
}

export async function removeSkill(
  volunteerId: number,
  skillId: number,
): Promise<void> {
  await requireVolunteer(volunteerId);

  await deleteJunctionRow(
    volunteerSkills,
    and(
      eq(volunteerSkills.volunteerId, volunteerId),
      eq(volunteerSkills.skillId, skillId),
    ),
    "Skill assignment not found",
  );
}
