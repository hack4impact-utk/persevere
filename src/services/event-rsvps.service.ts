import { eq } from "drizzle-orm";

import db from "@/db";
import { opportunities, users, volunteerRsvps, volunteers } from "@/db/schema";
import { NotFoundError } from "@/utils/errors";

export type EventRsvp = {
  volunteerId: number;
  firstName: string;
  lastName: string;
  rsvpStatus: string;
};

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
