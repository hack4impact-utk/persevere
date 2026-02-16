import { and, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm";

import db from "@/db";
import { opportunities, volunteerHours, volunteers } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type HoursFilters = {
  volunteerId: number;
  startDate?: string | null;
  endDate?: string | null;
  verified?: string | null;
};

export type LogHoursInput = {
  volunteerId: number;
  opportunityId: number;
  date: string;
  hours: number;
  notes?: string;
};

/**
 * Lists volunteer hour records with optional date/verification filters and total sum.
 * Returns null if the volunteer is not found.
 */
export async function listVolunteerHours(filters: HoursFilters): Promise<{
  data: {
    id: number;
    date: Date;
    hours: number;
    notes: string | null;
    verifiedAt: Date | null;
    opportunityTitle: string | null;
  }[];
  totalHours: number;
}> {
  const { volunteerId, startDate, endDate, verified } = filters;

  const conditions = [eq(volunteerHours.volunteerId, volunteerId)];
  if (startDate) conditions.push(gte(volunteerHours.date, new Date(startDate)));
  if (endDate) conditions.push(lte(volunteerHours.date, new Date(endDate)));
  if (verified === "true")
    conditions.push(isNotNull(volunteerHours.verifiedAt));
  if (verified === "false") conditions.push(isNull(volunteerHours.verifiedAt));

  const [hoursRecords, totalResult] = await Promise.all([
    db
      .select({
        id: volunteerHours.id,
        date: volunteerHours.date,
        hours: volunteerHours.hours,
        notes: volunteerHours.notes,
        verifiedAt: volunteerHours.verifiedAt,
        opportunityTitle: opportunities.title,
      })
      .from(volunteerHours)
      .leftJoin(
        opportunities,
        eq(volunteerHours.opportunityId, opportunities.id),
      )
      .where(and(...conditions))
      .orderBy(volunteerHours.date),

    db
      .select({ total: sql<number>`sum(${volunteerHours.hours})` })
      .from(volunteerHours)
      .where(and(...conditions)),
  ]);

  return {
    data: hoursRecords,
    totalHours: totalResult[0]?.total || 0,
  };
}

/**
 * Logs hours for a volunteer against an opportunity.
 * Throws if the volunteer or opportunity is not found.
 */
export async function logHours(input: LogHoursInput): Promise<{
  id: number;
  volunteerId: number;
  opportunityId: number;
  date: Date;
  hours: number;
  notes: string | null;
  verifiedBy: number | null;
  verifiedAt: Date | null;
}> {
  const [volunteerExists, opportunityExists] = await Promise.all([
    db
      .select()
      .from(volunteers)
      .where(eq(volunteers.id, input.volunteerId))
      .limit(1),
    db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, input.opportunityId))
      .limit(1),
  ]);

  if (volunteerExists.length === 0) {
    throw new NotFoundError("Volunteer not found");
  }
  if (opportunityExists.length === 0) {
    throw new NotFoundError("Opportunity not found");
  }

  const newEntry = await db
    .insert(volunteerHours)
    .values({
      volunteerId: input.volunteerId,
      opportunityId: input.opportunityId,
      date: new Date(input.date),
      hours: input.hours,
      notes: input.notes,
    })
    .returning();

  if (!newEntry[0]) throw new Error("Failed to log hours");
  return newEntry[0];
}

export type HoursRecord = typeof volunteerHours.$inferSelect;

/**
 * Updates a volunteer hours record. Allows verification or editing unverified records.
 * Throws NotFoundError if the record does not exist.
 */
export async function updateHours(
  hourId: number,
  data: {
    verify?: boolean;
    hours?: number;
    notes?: string;
    verifiedBy?: number;
  },
): Promise<HoursRecord> {
  const existing = await db
    .select()
    .from(volunteerHours)
    .where(eq(volunteerHours.id, hourId))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError("Record not found");
  }

  const currentRecord = existing[0];
  const updateData: Partial<typeof volunteerHours.$inferInsert> = {};

  if (data.verify) {
    updateData.verifiedBy = data.verifiedBy;
    updateData.verifiedAt = new Date();
  } else {
    if (currentRecord.verifiedAt !== null) {
      throw new ConflictError(
        "Cannot edit hours that have already been verified.",
      );
    }
    if (data.hours !== undefined) updateData.hours = data.hours;
    if (data.notes !== undefined) updateData.notes = data.notes;
  }

  const updated = await db
    .update(volunteerHours)
    .set(updateData)
    .where(eq(volunteerHours.id, hourId))
    .returning();

  return updated[0];
}

/**
 * Deletes a volunteer hours record if it has not been verified.
 * Throws NotFoundError if not found, ConflictError if already verified.
 */
export async function deleteHours(hourId: number): Promise<void> {
  const existing = await db
    .select()
    .from(volunteerHours)
    .where(eq(volunteerHours.id, hourId))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError("Record not found");
  }

  if (existing[0].verifiedAt !== null) {
    throw new ConflictError(
      "Cannot delete hours that have already been verified.",
    );
  }

  await db.delete(volunteerHours).where(eq(volunteerHours.id, hourId));
}
