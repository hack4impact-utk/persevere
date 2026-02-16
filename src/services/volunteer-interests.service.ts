import { and, eq } from "drizzle-orm";

import db from "@/db";
import { interests, volunteerInterests, volunteers } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type InterestDetail = {
  interestId: number;
  interestName: string | null;
  interestDescription: string | null;
};

export async function getVolunteerInterests(
  volunteerId: number,
): Promise<InterestDetail[]> {
  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId));

  if (volunteer.length === 0) {
    throw new NotFoundError("Volunteer not found");
  }

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
  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId));

  if (volunteer.length === 0) {
    throw new NotFoundError("Volunteer not found");
  }

  const interest = await db
    .select()
    .from(interests)
    .where(eq(interests.id, interestId));

  if (interest.length === 0) {
    throw new NotFoundError("Interest not found");
  }

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
