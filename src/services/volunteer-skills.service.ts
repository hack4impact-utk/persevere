import { and, eq } from "drizzle-orm";

import db from "@/db";
import { skills, volunteers, volunteerSkills } from "@/db/schema";
import { NotFoundError } from "@/utils/errors";

export type SkillDetail = {
  skillId: number;
  skillName: string | null;
  skillDescription: string | null;
  skillCategory: string | null;
  proficiencyLevel: "beginner" | "intermediate" | "advanced";
};

export async function getVolunteerSkills(
  volunteerId: number,
): Promise<SkillDetail[]> {
  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId));

  if (volunteer.length === 0) {
    throw new NotFoundError("Volunteer not found");
  }

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
  level: "beginner" | "intermediate" | "advanced",
): Promise<AssignSkillResult> {
  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId));

  if (volunteer.length === 0) {
    throw new NotFoundError("Volunteer not found");
  }

  const skill = await db.select().from(skills).where(eq(skills.id, skillId));

  if (skill.length === 0) {
    throw new NotFoundError("Skill not found");
  }

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
  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId));
  if (volunteer.length === 0) throw new NotFoundError("Volunteer not found");

  const existing = await db
    .select()
    .from(volunteerSkills)
    .where(
      and(
        eq(volunteerSkills.volunteerId, volunteerId),
        eq(volunteerSkills.skillId, skillId),
      ),
    );
  if (existing.length === 0)
    throw new NotFoundError("Skill assignment not found");

  await db
    .delete(volunteerSkills)
    .where(
      and(
        eq(volunteerSkills.volunteerId, volunteerId),
        eq(volunteerSkills.skillId, skillId),
      ),
    );
}
