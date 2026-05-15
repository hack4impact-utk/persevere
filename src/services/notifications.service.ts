import { and, between, eq, isNull, ne } from "drizzle-orm";

import db from "@/db";
import { opportunities, volunteerRsvps } from "@/db/schema/opportunities";
import { users, volunteers } from "@/db/schema/users";
import { sendEventReminderEmail } from "@/utils/server/email";

type ReminderResult = {
  sent: number;
  failed: number;
  failures: { email: string; error: string }[];
};

type ReminderRow = {
  volunteerId: number;
  opportunityId: number;
  email: string;
  firstName: string;
  eventTitle: string;
  eventStart: Date;
  eventEnd: Date;
  eventLocation: string;
};

/**
 * Sends one reminder email per confirmed RSVP whose event starts within the
 * next 24 hours and which has not been reminded yet. Designed to be safe to
 * run frequently (every 30 min) — the reminder_sent_at filter ensures each
 * RSVP is reminded exactly once unless cleared by a status transition back
 * to "confirmed".
 *
 * Emails are dispatched in parallel chunks of 5 to keep total send time
 * bounded while staying within Gmail SMTP concurrency limits.
 */
export async function sendUpcomingReminders(): Promise<ReminderResult> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      volunteerId: volunteerRsvps.volunteerId,
      opportunityId: volunteerRsvps.opportunityId,
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
        isNull(volunteerRsvps.reminderSentAt),
      ),
    );

  let sent = 0;
  let failed = 0;
  const failures: { email: string; error: string }[] = [];

  const concurrency = 5;
  for (let i = 0; i < rows.length; i += concurrency) {
    const chunk = rows.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      chunk.map((row) =>
        sendEventReminderEmail(row.email, row.firstName, {
          title: row.eventTitle,
          startDate: row.eventStart,
          endDate: row.eventEnd,
          location: row.eventLocation,
        }),
      ),
    );

    // Process results and mark reminded RSVPs
    const markPromises: Promise<void>[] = [];
    for (const [j, result] of results.entries()) {
      const row = chunk[j];
      if (result.status === "rejected") {
        failed++;
        const reason = result.reason;
        failures.push({
          email: row.email,
          error: reason instanceof Error ? reason.message : String(reason),
        });
        continue;
      }

      sent++;
      markPromises.push(markAsReminded(row));
    }

    // Batch-persist reminder_sent_at for all successful sends in this chunk
    await Promise.allSettled(markPromises);
  }

  return { sent, failed, failures };
}

/**
 * Mark a single RSVP as reminded so subsequent cron ticks skip it.
 * If this write fails (rare DB blip) the volunteer may get a duplicate
 * reminder on the next tick; we log and move on rather than failing the send.
 */
async function markAsReminded(row: ReminderRow): Promise<void> {
  try {
    await db
      .update(volunteerRsvps)
      .set({ reminderSentAt: new Date() })
      .where(
        and(
          eq(volunteerRsvps.volunteerId, row.volunteerId),
          eq(volunteerRsvps.opportunityId, row.opportunityId),
        ),
      );
  } catch (error) {
    console.error(
      `[notifications] Failed to persist reminder_sent_at for volunteer=${row.volunteerId} opportunity=${row.opportunityId}; volunteer may receive a duplicate reminder on the next cron tick`,
      error,
    );
  }
}
