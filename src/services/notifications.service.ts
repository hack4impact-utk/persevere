import { and, between, eq, ne } from "drizzle-orm";

import db from "@/db";
import { opportunities, volunteerRsvps } from "@/db/schema/opportunities";
import { users, volunteers } from "@/db/schema/users";
import { sendEventReminderEmail } from "@/utils/server/email";

type ReminderResult = {
  sent: number;
  failed: number;
  failures: { email: string; error: string }[];
};

/**
 * Queries events starting in the next 24 hours with confirmed RSVPs,
 * excluding volunteers who have opted out of notifications. Multiple events
 * for the same volunteer are each sent as separate emails within the same
 * cron run (batched invocation).
 */
export async function sendUpcomingReminders(): Promise<ReminderResult> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      email: users.email,
      firstName: users.firstName,
      eventTitle: opportunities.title,
      eventStart: opportunities.startDate,
      eventEnd: opportunities.endDate,
      eventLocation: opportunities.location,
    })
    .from(volunteerRsvps)
    .innerJoin(volunteers, eq(volunteerRsvps.volunteerId, volunteers.id))
    .innerJoin(users, eq(volunteers.userId, users.id))
    .innerJoin(
      opportunities,
      eq(volunteerRsvps.opportunityId, opportunities.id),
    )
    .where(
      and(
        eq(volunteerRsvps.status, "confirmed"),
        between(opportunities.startDate, now, in24h),
        ne(volunteers.notificationPreference, "none"),
      ),
    );

  let sent = 0;
  let failed = 0;
  const failures: { email: string; error: string }[] = [];

  for (const row of rows) {
    try {
      await sendEventReminderEmail(row.email, row.firstName, {
        title: row.eventTitle,
        startDate: row.eventStart,
        endDate: row.eventEnd,
        location: row.eventLocation,
      });
      sent++;
    } catch (error) {
      failed++;
      failures.push({
        email: row.email,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { sent, failed, failures };
}
