import { and, eq } from "drizzle-orm";

import db from "@/db";
import { interests } from "@/db/schema";
import { opportunityInterests } from "@/db/schema/opportunities";
import {
  requireInterest,
  requireOpportunity,
} from "@/services/shared/entity-checks";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type RequiredInterest = {
  interestId: number;
  interestName: string | null;
};

export async function getRequiredInterests(
  eventId: number,
): Promise<RequiredInterest[]> {
  await requireOpportunity(eventId);
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
  await requireOpportunity(eventId);
  await requireInterest(interestId);
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
  await requireOpportunity(eventId);
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
