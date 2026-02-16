import { and, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm";

import db from "@/db";
import { opportunities, volunteerHours, volunteers } from "@/db/schema";
import { NotFoundError } from "@/utils/errors";

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
