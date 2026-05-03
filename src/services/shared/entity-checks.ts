import type { SQL } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";
import type { AnyPgTable } from "drizzle-orm/pg-core";

import db from "@/db";
import { interests, skills, volunteers } from "@/db/schema";
import { opportunities } from "@/db/schema/opportunities";
import { ConflictError, NotFoundError } from "@/utils/errors";

export async function requireVolunteer(volunteerId: number): Promise<void> {
  const [row] = await db
    .select({ id: volunteers.id })
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId))
    .limit(1);
  if (!row) throw new NotFoundError("Volunteer not found");
}

export async function requireSkill(skillId: number): Promise<void> {
  const [row] = await db
    .select({ id: skills.id })
    .from(skills)
    .where(eq(skills.id, skillId))
    .limit(1);
  if (!row) throw new NotFoundError("Skill not found");
}

export async function requireInterest(interestId: number): Promise<void> {
  const [row] = await db
    .select({ id: interests.id })
    .from(interests)
    .where(eq(interests.id, interestId))
    .limit(1);
  if (!row) throw new NotFoundError("Interest not found");
}

export async function requireOpportunity(opportunityId: number): Promise<void> {
  const [row] = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId))
    .limit(1);
  if (!row) throw new NotFoundError("Opportunity not found");
}

export async function assertJunctionAbsent(
  table: AnyPgTable,
  where: SQL | undefined,
  message: string,
): Promise<void> {
  const [row] = await db
    .select({ _: sql<number>`1` })
    .from(table)
    .where(where)
    .limit(1);
  if (row) throw new ConflictError(message);
}

export async function deleteJunctionRow(
  table: AnyPgTable,
  where: SQL | undefined,
  message: string,
): Promise<void> {
  const deleted = await db.delete(table).where(where).returning();
  if (deleted.length === 0) throw new NotFoundError(message);
}
