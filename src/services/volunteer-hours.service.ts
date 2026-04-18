import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import db from "@/db";
import {
  opportunities,
  volunteerHours,
  volunteerRsvps,
  volunteers,
} from "@/db/schema";
import { users } from "@/db/schema/users";
import { ConflictError, NotFoundError, ValidationError } from "@/utils/errors";

export type AllHoursRecord = {
  id: number;
  volunteerId: number;
  volunteerName: string;
  opportunityId: number;
  opportunityTitle: string | null;
  date: Date;
  hours: number;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
};

/**
 * Lists all volunteer hour records across all volunteers, optionally filtered by status.
 * Used by staff for the global Approvals > Hours view.
 */
export async function listAllHours(
  status?: "pending" | "approved" | "rejected",
): Promise<AllHoursRecord[]> {
  const conditions = status ? [eq(volunteerHours.status, status)] : [];

  return db
    .select({
      id: volunteerHours.id,
      volunteerId: volunteerHours.volunteerId,
      volunteerName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
      opportunityId: volunteerHours.opportunityId,
      opportunityTitle: opportunities.title,
      date: volunteerHours.date,
      hours: volunteerHours.hours,
      notes: volunteerHours.notes,
      status: volunteerHours.status,
      rejectionReason: volunteerHours.rejectionReason,
    })
    .from(volunteerHours)
    .innerJoin(volunteers, eq(volunteerHours.volunteerId, volunteers.id))
    .innerJoin(users, eq(volunteers.userId, users.id))
    .leftJoin(opportunities, eq(volunteerHours.opportunityId, opportunities.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(volunteerHours.date));
}

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

export type VolunteerLogHoursInput = {
  opportunityId: number;
  date: string;
  hours: number;
  notes?: string;
};

export type VolunteerHour = typeof volunteerHours.$inferSelect & {
  opportunityTitle?: string | null;
};

/**
 * Lists volunteer hour records with optional date/verification filters and total sum.
 */
export async function listVolunteerHours(filters: HoursFilters): Promise<{
  data: {
    id: number;
    date: Date;
    hours: number;
    notes: string | null;
    status: "pending" | "approved" | "rejected";
    rejectionReason: string | null;
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
    conditions.push(eq(volunteerHours.status, "approved"));
  if (verified === "false")
    conditions.push(eq(volunteerHours.status, "pending"));

  const [hoursRecords, totalResult] = await Promise.all([
    db
      .select({
        id: volunteerHours.id,
        date: volunteerHours.date,
        hours: volunteerHours.hours,
        notes: volunteerHours.notes,
        status: volunteerHours.status,
        rejectionReason: volunteerHours.rejectionReason,
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
 * Logs hours for a volunteer against an opportunity (staff action).
 * Throws if the volunteer or opportunity is not found.
 */
export async function logHours(input: LogHoursInput): Promise<{
  id: number;
  volunteerId: number;
  opportunityId: number;
  date: Date;
  hours: number;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
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

  if (input.hours <= 0 || input.hours > 24) {
    throw new ValidationError("Hours must be between 0 and 24");
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
 * Updates a volunteer hours record. Allows editing unverified records.
 * Throws NotFoundError if the record does not exist.
 */
export async function updateHours(
  hourId: number,
  data: {
    hours?: number;
    notes?: string;
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

  if (currentRecord.status === "approved") {
    throw new ConflictError(
      "Cannot edit hours that have already been approved.",
    );
  }
  if (data.hours !== undefined) updateData.hours = data.hours;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const updated = await db
    .update(volunteerHours)
    .set(updateData)
    .where(eq(volunteerHours.id, hourId))
    .returning();

  return updated[0];
}

/**
 * Approves a pending hours record. Only pending records can be approved.
 */
export async function approveHours(
  hoursId: number,
  approvedBy: number,
): Promise<HoursRecord> {
  const [existing] = await db
    .select()
    .from(volunteerHours)
    .where(eq(volunteerHours.id, hoursId));
  if (!existing) throw new NotFoundError("Hours record not found");
  if (existing.status !== "pending") {
    throw new ConflictError("Only pending hours can be approved");
  }
  const [updated] = await db
    .update(volunteerHours)
    .set({ status: "approved", verifiedBy: approvedBy, verifiedAt: new Date() })
    .where(eq(volunteerHours.id, hoursId))
    .returning();
  return updated;
}

/**
 * Rejects a pending hours record with an optional reason.
 */
export async function rejectHours(
  hoursId: number,
  rejectedBy: number,
  reason?: string,
): Promise<HoursRecord> {
  const [existing] = await db
    .select()
    .from(volunteerHours)
    .where(eq(volunteerHours.id, hoursId));
  if (!existing) throw new NotFoundError("Hours record not found");
  if (existing.status !== "pending") {
    throw new ConflictError("Only pending hours can be rejected");
  }
  const [updated] = await db
    .update(volunteerHours)
    .set({
      status: "rejected",
      verifiedBy: rejectedBy,
      verifiedAt: new Date(),
      rejectionReason: reason ?? null,
    })
    .where(eq(volunteerHours.id, hoursId))
    .returning();
  return updated;
}

/**
 * Volunteer self-logs hours. Validates the volunteer has an RSVP for the event
 * and that the RSVP status is not declined or no_show.
 */
export async function volunteerLogHours(
  volunteerId: number,
  input: VolunteerLogHoursInput,
): Promise<HoursRecord> {
  const { opportunityId, date, hours, notes } = input;
  if (hours <= 0 || hours > 24) {
    throw new ValidationError("Hours must be between 0 and 24");
  }
  const [rsvp] = await db
    .select()
    .from(volunteerRsvps)
    .where(
      and(
        eq(volunteerRsvps.volunteerId, volunteerId),
        eq(volunteerRsvps.opportunityId, opportunityId),
      ),
    );
  if (!rsvp) {
    throw new ValidationError(
      "You can only log hours for events you RSVPed to",
    );
  }
  if (["declined", "no_show", "cancelled"].includes(rsvp.status)) {
    throw new ValidationError(
      "You cannot log hours for events you declined, cancelled, or did not attend",
    );
  }
  const [created] = await db
    .insert(volunteerHours)
    .values({
      volunteerId,
      opportunityId,
      date: new Date(date),
      hours,
      notes: notes ?? null,
      status: "pending",
    })
    .returning();
  return created;
}

/**
 * Lists all hours for a volunteer with opportunity titles, ordered by date desc.
 */
export async function listVolunteerOwnHours(volunteerId: number): Promise<
  {
    id: number;
    volunteerId: number;
    opportunityId: number;
    opportunityTitle: string | null;
    date: Date;
    hours: number;
    notes: string | null;
    status: "pending" | "approved" | "rejected";
    rejectionReason: string | null;
    verifiedBy: number | null;
    verifiedAt: Date | null;
  }[]
> {
  return db
    .select({
      id: volunteerHours.id,
      volunteerId: volunteerHours.volunteerId,
      opportunityId: volunteerHours.opportunityId,
      opportunityTitle: opportunities.title,
      date: volunteerHours.date,
      hours: volunteerHours.hours,
      notes: volunteerHours.notes,
      status: volunteerHours.status,
      rejectionReason: volunteerHours.rejectionReason,
      verifiedBy: volunteerHours.verifiedBy,
      verifiedAt: volunteerHours.verifiedAt,
    })
    .from(volunteerHours)
    .leftJoin(opportunities, eq(volunteerHours.opportunityId, opportunities.id))
    .where(eq(volunteerHours.volunteerId, volunteerId))
    .orderBy(desc(volunteerHours.date));
}

/**
 * Deletes a volunteer's own hours entry. Only pending entries can be deleted by the volunteer.
 */
export async function volunteerDeleteHours(
  hoursId: number,
  volunteerId: number,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(volunteerHours)
    .where(
      and(
        eq(volunteerHours.id, hoursId),
        eq(volunteerHours.volunteerId, volunteerId),
      ),
    );
  if (!existing) throw new NotFoundError("Hours record not found");
  if (existing.status !== "pending") {
    throw new ConflictError("Only pending hours can be deleted");
  }
  await db.delete(volunteerHours).where(eq(volunteerHours.id, hoursId));
}

/**
 * Deletes a volunteer hours record if it has not been approved (staff action).
 * Throws NotFoundError if not found, ConflictError if already approved.
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

  if (existing[0].status === "approved") {
    throw new ConflictError("Approved hours cannot be deleted");
  }

  await db.delete(volunteerHours).where(eq(volunteerHours.id, hourId));
}
