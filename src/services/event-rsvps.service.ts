import { and, desc, eq, exists, sql } from "drizzle-orm";

import db from "@/db";
import { opportunities, users, volunteerRsvps, volunteers } from "@/db/schema";
import { NotFoundError, ValidationError } from "@/utils/errors";

export type EventRsvp = {
  volunteerId: number;
  firstName: string;
  lastName: string;
  rsvpStatus: string;
};

export type PendingRsvp = {
  volunteerId: number;
  volunteerName: string;
  opportunityId: number;
  opportunityTitle: string;
  opportunityStartDate: Date;
  rsvpAt: Date;
};

/**
 * Lists all RSVPs with a given status (default: pending) across all events.
 * Used by staff for the global Approvals > RSVPs view.
 */
export async function listRsvpsByStatus(
  status:
    | "pending"
    | "confirmed"
    | "declined"
    | "attended"
    | "no_show" = "pending",
): Promise<PendingRsvp[]> {
  const rows = await db
    .select({
      volunteerId: volunteerRsvps.volunteerId,
      firstName: users.firstName,
      lastName: users.lastName,
      opportunityId: volunteerRsvps.opportunityId,
      opportunityTitle: opportunities.title,
      opportunityStartDate: opportunities.startDate,
      rsvpAt: volunteerRsvps.rsvpAt,
    })
    .from(volunteerRsvps)
    .innerJoin(volunteers, eq(volunteerRsvps.volunteerId, volunteers.id))
    .innerJoin(users, eq(volunteers.userId, users.id))
    .innerJoin(
      opportunities,
      eq(volunteerRsvps.opportunityId, opportunities.id),
    )
    .where(eq(volunteerRsvps.status, status));

  return rows.map((r) => ({
    volunteerId: r.volunteerId,
    volunteerName: `${r.firstName} ${r.lastName}`,
    opportunityId: r.opportunityId,
    opportunityTitle: r.opportunityTitle,
    opportunityStartDate: r.opportunityStartDate,
    rsvpAt: r.rsvpAt,
  }));
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "declined", "attended", "no_show", "cancelled"],
  confirmed: ["attended", "no_show", "declined", "cancelled"],
  declined: [],
  attended: ["no_show", "cancelled"],
  no_show: ["attended", "cancelled"],
  cancelled: ["confirmed"],
};

/**
 * Updates the status of a specific volunteer's RSVP for an event.
 * Enforces allowed status transitions.
 */
export async function updateRsvpStatus(
  volunteerId: number,
  opportunityId: number,
  newStatus: "confirmed" | "declined" | "attended" | "no_show" | "cancelled",
): Promise<void> {
  const [rsvp] = await db
    .select()
    .from(volunteerRsvps)
    .where(
      and(
        eq(volunteerRsvps.volunteerId, volunteerId),
        eq(volunteerRsvps.opportunityId, opportunityId),
      ),
    );

  if (!rsvp) throw new NotFoundError("RSVP not found");

  const allowed = VALID_TRANSITIONS[rsvp.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new ValidationError(
      `Cannot transition RSVP from "${rsvp.status}" to "${newStatus}"`,
    );
  }

  await db
    .update(volunteerRsvps)
    .set({ status: newStatus })
    .where(
      and(
        eq(volunteerRsvps.volunteerId, volunteerId),
        eq(volunteerRsvps.opportunityId, opportunityId),
      ),
    );
}

export type EventWithConfirmedCount = {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  status: "open" | "full" | "completed" | "canceled";
  confirmedCount: number;
};

/**
 * Returns all events with a count of how many RSVPs are still in "confirmed" status.
 * Used by the Attendance tab to split events into "needs attention" vs "completed".
 */
export async function getEventsWithConfirmedCounts(): Promise<
  EventWithConfirmedCount[]
> {
  const confirmedSubquery = db
    .select({
      opportunityId: volunteerRsvps.opportunityId,
      confirmedCount: sql<number>`cast(count(*) as int)`.as("confirmedCount"),
    })
    .from(volunteerRsvps)
    .where(eq(volunteerRsvps.status, "confirmed"))
    .groupBy(volunteerRsvps.opportunityId)
    .as("confirmed_counts");

  const rows = await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      startDate: opportunities.startDate,
      endDate: opportunities.endDate,
      status: opportunities.status,
      confirmedCount: sql<number>`coalesce(${confirmedSubquery.confirmedCount}, 0)`,
    })
    .from(opportunities)
    .leftJoin(
      confirmedSubquery,
      eq(opportunities.id, confirmedSubquery.opportunityId),
    )
    .where(
      exists(
        db
          .select({ _: sql`1` })
          .from(volunteerRsvps)
          .where(eq(volunteerRsvps.opportunityId, opportunities.id)),
      ),
    )
    .orderBy(desc(opportunities.startDate));

  return rows.map((r) => ({
    ...r,
    confirmedCount: r.confirmedCount ?? 0,
  }));
}

export async function getEventRsvps(eventId: number): Promise<EventRsvp[]> {
  const event = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(eq(opportunities.id, eventId));

  if (event.length === 0) {
    throw new NotFoundError("Event not found");
  }

  const rows = await db
    .select({
      volunteerId: volunteerRsvps.volunteerId,
      firstName: users.firstName,
      lastName: users.lastName,
      rsvpStatus: volunteerRsvps.status,
    })
    .from(volunteerRsvps)
    .innerJoin(volunteers, eq(volunteerRsvps.volunteerId, volunteers.id))
    .innerJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteerRsvps.opportunityId, eventId));

  return rows;
}
