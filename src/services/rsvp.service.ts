import { and, count, desc, eq } from "drizzle-orm";

import db from "@/db";
import { volunteers } from "@/db/schema";
import { opportunities, volunteerRsvps } from "@/db/schema/opportunities";

export class RsvpError extends Error {
  constructor(
    public readonly code:
      | "VOLUNTEER_NOT_FOUND"
      | "OPPORTUNITY_NOT_FOUND"
      | "OPPORTUNITY_NOT_OPEN"
      | "OPPORTUNITY_IN_PAST"
      | "ALREADY_RSVPD"
      | "OPPORTUNITY_FULL"
      | "RSVP_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "RsvpError";
  }
}

/**
 * Creates an RSVP for a volunteer to an opportunity.
 * Throws RsvpError for domain-level validation failures.
 */
export async function createRsvp(
  userId: number,
  opportunityId: number,
): Promise<{ volunteerId: number; opportunityId: number; status: "pending" }> {
  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.userId, userId));

  if (volunteer.length === 0) {
    throw new RsvpError("VOLUNTEER_NOT_FOUND", "Volunteer profile not found");
  }

  const volunteerId = volunteer[0].id;

  const opportunity = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId));

  if (opportunity.length === 0) {
    throw new RsvpError("OPPORTUNITY_NOT_FOUND", "Opportunity not found");
  }

  if (opportunity[0].status !== "open") {
    throw new RsvpError(
      "OPPORTUNITY_NOT_OPEN",
      "Opportunity is not open for RSVPs",
    );
  }

  if (new Date(opportunity[0].startDate) <= new Date()) {
    throw new RsvpError(
      "OPPORTUNITY_IN_PAST",
      "Cannot RSVP to past opportunities",
    );
  }

  const existingRsvp = await db
    .select()
    .from(volunteerRsvps)
    .where(
      and(
        eq(volunteerRsvps.volunteerId, volunteerId),
        eq(volunteerRsvps.opportunityId, opportunityId),
      ),
    );

  if (existingRsvp.length > 0) {
    throw new RsvpError(
      "ALREADY_RSVPD",
      "You have already RSVP'd to this opportunity",
    );
  }

  if (opportunity[0].maxVolunteers !== null) {
    const rsvpCount = await db
      .select({ count: count() })
      .from(volunteerRsvps)
      .where(eq(volunteerRsvps.opportunityId, opportunityId));

    if (rsvpCount[0].count >= opportunity[0].maxVolunteers) {
      throw new RsvpError("OPPORTUNITY_FULL", "This opportunity is full");
    }
  }

  await db.insert(volunteerRsvps).values({
    volunteerId,
    opportunityId,
    status: "pending",
  });

  return { volunteerId, opportunityId, status: "pending" as const };
}

/**
 * Cancels an existing RSVP.
 * Throws RsvpError if the volunteer or RSVP is not found.
 */
export async function cancelRsvp(
  userId: number,
  opportunityId: number,
): Promise<{ volunteerId: number; opportunityId: number }> {
  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.userId, userId));

  if (volunteer.length === 0) {
    throw new RsvpError("VOLUNTEER_NOT_FOUND", "Volunteer profile not found");
  }

  const volunteerId = volunteer[0].id;

  const existingRsvp = await db
    .select()
    .from(volunteerRsvps)
    .where(
      and(
        eq(volunteerRsvps.volunteerId, volunteerId),
        eq(volunteerRsvps.opportunityId, opportunityId),
      ),
    );

  if (existingRsvp.length === 0) {
    throw new RsvpError("RSVP_NOT_FOUND", "RSVP not found");
  }

  await db
    .delete(volunteerRsvps)
    .where(
      and(
        eq(volunteerRsvps.volunteerId, volunteerId),
        eq(volunteerRsvps.opportunityId, opportunityId),
      ),
    );

  return { volunteerId, opportunityId };
}

export type RsvpWithOpportunity = {
  opportunityId: number | null;
  rsvpStatus:
    | "pending"
    | "confirmed"
    | "declined"
    | "attended"
    | "no_show"
    | null;
  rsvpAt: Date | null;
  notes: string | null;
  opportunityTitle: string | null;
  opportunityDescription: string | null;
  opportunityLocation: string | null;
  opportunityStartDate: Date | null;
  opportunityEndDate: Date | null;
  opportunityStatus: "open" | "full" | "completed" | "canceled" | null;
};

export async function getVolunteerRsvps(
  userId: number,
): Promise<RsvpWithOpportunity[]> {
  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.userId, userId));
  if (volunteer.length === 0)
    throw new RsvpError("VOLUNTEER_NOT_FOUND", "Volunteer profile not found");

  return db
    .select({
      opportunityId: volunteerRsvps.opportunityId,
      rsvpStatus: volunteerRsvps.status,
      rsvpAt: volunteerRsvps.rsvpAt,
      notes: volunteerRsvps.notes,
      opportunityTitle: opportunities.title,
      opportunityDescription: opportunities.description,
      opportunityLocation: opportunities.location,
      opportunityStartDate: opportunities.startDate,
      opportunityEndDate: opportunities.endDate,
      opportunityStatus: opportunities.status,
    })
    .from(volunteerRsvps)
    .leftJoin(opportunities, eq(volunteerRsvps.opportunityId, opportunities.id))
    .where(eq(volunteerRsvps.volunteerId, volunteer[0].id))
    .orderBy(desc(opportunities.startDate));
}
