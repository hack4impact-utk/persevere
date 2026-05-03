import { and, eq } from "drizzle-orm";

import db from "@/db";
import { interests } from "@/db/schema";
import { opportunityInterests } from "@/db/schema/opportunities";
import {
  assertJunctionAbsent,
  deleteJunctionRow,
  requireInterest,
  requireOpportunity,
} from "@/services/shared/entity-checks";

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
  await assertJunctionAbsent(
    opportunityInterests,
    and(
      eq(opportunityInterests.opportunityId, eventId),
      eq(opportunityInterests.interestId, interestId),
    ),
    "Interest already required for this opportunity",
  );
  await db
    .insert(opportunityInterests)
    .values({ opportunityId: eventId, interestId });
}

export async function removeRequiredInterest(
  eventId: number,
  interestId: number,
): Promise<void> {
  await requireOpportunity(eventId);
  await deleteJunctionRow(
    opportunityInterests,
    and(
      eq(opportunityInterests.opportunityId, eventId),
      eq(opportunityInterests.interestId, interestId),
    ),
    "Interest assignment not found",
  );
}
