import { and, eq } from "drizzle-orm";

import db from "@/db";
import { interests } from "@/db/schema";
import { opportunities, opportunityInterests } from "@/db/schema/opportunities";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type RequiredInterest = {
  interestId: number;
  interestName: string | null;
};

async function requireEvent(eventId: number): Promise<void> {
  const [event] = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(eq(opportunities.id, eventId));
  if (!event) throw new NotFoundError("Calendar event not found");
}

export async function getRequiredInterests(
  eventId: number,
): Promise<RequiredInterest[]> {
  await requireEvent(eventId);
  return db
    .select({
      interestId: opportunityInterests.interestId,
      interestName: interests.name,
    })
    .from(opportunityInterests)
    .leftJoin(interests, eq(opportunityInterests.interestId, interests.id))
    .where(eq(opportunityInterests.opportunityId, eventId));
}

export async function addRequiredInterest(
  eventId: number,
  interestId: number,
): Promise<void> {
  await requireEvent(eventId);
  const [interest] = await db
    .select({ id: interests.id })
    .from(interests)
    .where(eq(interests.id, interestId));
  if (!interest) throw new NotFoundError("Interest not found");
  const existing = await db
    .select()
    .from(opportunityInterests)
    .where(
      and(
        eq(opportunityInterests.opportunityId, eventId),
        eq(opportunityInterests.interestId, interestId),
      ),
    );
  if (existing.length > 0) {
    throw new ConflictError("Interest already required for this opportunity");
  }
  await db
    .insert(opportunityInterests)
    .values({ opportunityId: eventId, interestId });
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
