import { and, eq } from "drizzle-orm";

import db from "@/db";
import { interests, volunteerInterests } from "@/db/schema";
import {
  requireInterest,
  requireVolunteer,
} from "@/services/shared/entity-checks";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type InterestDetail = {
  interestId: number;
  interestName: string | null;
  interestDescription: string | null;
};

export async function getVolunteerInterests(
  volunteerId: number,
): Promise<InterestDetail[]> {
  await requireVolunteer(volunteerId);

  return db
    .select({
      interestId: volunteerInterests.interestId,
      interestName: interests.name,
      interestDescription: interests.description,
    })
    .from(volunteerInterests)
    .leftJoin(interests, eq(volunteerInterests.interestId, interests.id))
    .where(eq(volunteerInterests.volunteerId, volunteerId));
}

export async function assignInterest(
  volunteerId: number,
  interestId: number,
): Promise<void> {
  await requireVolunteer(volunteerId);
  await requireInterest(interestId);

  const existing = await db
    .select()
    .from(volunteerInterests)
    .where(
      and(
        eq(volunteerInterests.volunteerId, volunteerId),
        eq(volunteerInterests.interestId, interestId),
      ),
    );

  if (existing.length > 0) {
    throw new ConflictError("Interest is already assigned to this volunteer");
  }

  await db.insert(volunteerInterests).values({ volunteerId, interestId });
}

export async function removeInterest(
  volunteerId: number,
  interestId: number,
): Promise<void> {
  await requireVolunteer(volunteerId);

  const existing = await db
    .select()
    .from(volunteerInterests)
    .where(
      and(
        eq(volunteerInterests.volunteerId, volunteerId),
        eq(volunteerInterests.interestId, interestId),
      ),
    );
  if (existing.length === 0)
    throw new NotFoundError("Interest assignment not found");

  await db
    .delete(volunteerInterests)
    .where(
      and(
        eq(volunteerInterests.volunteerId, volunteerId),
        eq(volunteerInterests.interestId, interestId),
      ),
    );
}
