import { and, eq } from "drizzle-orm";

import db from "@/db";
import {
  opportunities,
  opportunityInterests,
  opportunityRequiredSkills,
} from "@/db/schema/opportunities";
import { NotFoundError } from "@/utils/errors";

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
  await db
    .insert(opportunityRequiredSkills)
    .values({ opportunityId: eventId, skillId })
    .onConflictDoNothing();
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

export async function addRequiredInterest(
  eventId: number,
  interestId: number,
): Promise<void> {
  await requireEvent(eventId);
  await db
    .insert(opportunityInterests)
    .values({ opportunityId: eventId, interestId })
    .onConflictDoNothing();
}

export async function removeRequiredInterest(
  eventId: number,
  interestId: number,
): Promise<void> {
  await requireEvent(eventId);
  const deleted = await db
    .delete(opportunityInterests)
    .where(
      and(
        eq(opportunityInterests.opportunityId, eventId),
        eq(opportunityInterests.interestId, interestId),
      ),
    )
    .returning();
  if (deleted.length === 0)
    throw new NotFoundError("Interest assignment not found");
}
