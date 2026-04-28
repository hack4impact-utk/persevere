import { and, desc, eq, gte, sql } from "drizzle-orm";

import db from "@/db";
import {
  onboardingDocuments,
  opportunities,
  users,
  volunteerDocumentSignatures,
  volunteerHours,
  volunteerRsvps,
  volunteers,
} from "@/db/schema";
import {
  DEFAULT_PAGE_SIZE,
  PENDING_HOURS_LIMIT,
  RECENT_ACTIVITY_LIMIT,
  RECENT_OPPORTUNITIES_LIMIT,
} from "@/lib/constants";
import { toNumber } from "@/services/shared/db-helpers";

export type StaffUpcomingOpportunity = {
  id: number;
  title: string;
  startDate: string; // ISO string
  location: string;
};

export type PendingHoursEntry = {
  id: number;
  volunteerName: string;
  volunteerId: number;
  hours: number;
  date: string; // ISO string
};

export type PendingRsvpEntry = {
  volunteerId: number;
  volunteerName: string;
  opportunityId: number;
  opportunityTitle: string;
  rsvpAt: string; // ISO string
};

export type RecentActivityItem = {
  type: "new_volunteer" | "hours_submitted" | "rsvp_confirmed";
  label: string;
  timestamp: string; // ISO string
  href: string;
};

export type StaffDashboardStats = {
  activeVolunteers: number;
  totalVolunteerHours: number;
  upcomingOpportunities: number;
  pendingRsvps: number;
  upcomingList: StaffUpcomingOpportunity[];
  pendingHoursCount: number;
  onboardingIncomplete: number;
  pendingHoursList: PendingHoursEntry[];
  pendingRsvpsList: PendingRsvpEntry[];
  recentActivity: RecentActivityItem[];
};

export type VolunteerDashboard = {
  upcomingRsvps: {
    status: string;
    opportunity: {
      id: string;
      startDate: string;
    };
  }[];
  hours: {
    verified: number;
    pending: number;
    total: number;
    monthlyVerified: number;
  };
};

export async function getStaffDashboardStats(): Promise<StaffDashboardStats> {
  const now = new Date();

  const [
    volunteersCount,
    volunteerHoursAggregate,
    opportunitiesCount,
    volunteerRsvpsCount,
    upcomingRows,
    pendingHoursCountRows,
    pendingHoursRows,
    pendingRsvpsRows,
    [newVolunteerRows, hoursActivityRows, rsvpActivityRows],
  ] = await Promise.all([
    db
      .select({ count: sql<string>`count(*)` })
      .from(volunteers)
      .innerJoin(users, eq(volunteers.userId, users.id))
      .where(eq(users.isActive, true)),

    db
      .select({
        total: sql<string>`coalesce(sum(${volunteerHours.hours}), 0)`,
      })
      .from(volunteerHours),

    db
      .select({ count: sql<string>`count(*)` })
      .from(opportunities)
      .where(gte(opportunities.startDate, now)),

    db
      .select({ count: sql<string>`count(*)` })
      .from(volunteerRsvps)
      .where(eq(volunteerRsvps.status, "pending")),

    db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        startDate: opportunities.startDate,
        location: opportunities.location,
      })
      .from(opportunities)
      .where(gte(opportunities.startDate, now))
      .orderBy(opportunities.startDate)
      .limit(RECENT_OPPORTUNITIES_LIMIT),

    db
      .select({ count: sql<string>`count(*)` })
      .from(volunteerHours)
      .where(eq(volunteerHours.status, "pending")),

    db
      .select({
        id: volunteerHours.id,
        volunteerId: volunteers.id,
        firstName: users.firstName,
        lastName: users.lastName,
        hours: volunteerHours.hours,
        date: volunteerHours.date,
      })
      .from(volunteerHours)
      .innerJoin(volunteers, eq(volunteerHours.volunteerId, volunteers.id))
      .innerJoin(users, eq(volunteers.userId, users.id))
      .where(eq(volunteerHours.status, "pending"))
      .orderBy(desc(volunteerHours.date))
      .limit(PENDING_HOURS_LIMIT),

    db
      .select({
        volunteerId: volunteers.id,
        firstName: users.firstName,
        lastName: users.lastName,
        opportunityId: opportunities.id,
        opportunityTitle: opportunities.title,
        rsvpAt: volunteerRsvps.rsvpAt,
      })
      .from(volunteerRsvps)
      .innerJoin(volunteers, eq(volunteerRsvps.volunteerId, volunteers.id))
      .innerJoin(users, eq(volunteers.userId, users.id))
      .innerJoin(
        opportunities,
        eq(volunteerRsvps.opportunityId, opportunities.id),
      )
      .where(eq(volunteerRsvps.status, "pending"))
      .orderBy(desc(volunteerRsvps.rsvpAt))
      .limit(PENDING_HOURS_LIMIT),

    Promise.all([
      db
        .select({
          volunteerId: volunteers.id,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt,
        })
        .from(volunteers)
        .innerJoin(users, eq(volunteers.userId, users.id))
        .where(eq(users.isActive, true))
        .orderBy(desc(users.createdAt))
        .limit(5),

      db
        .select({
          volunteerId: volunteers.id,
          firstName: users.firstName,
          lastName: users.lastName,
          hours: volunteerHours.hours,
          date: volunteerHours.date,
        })
        .from(volunteerHours)
        .innerJoin(volunteers, eq(volunteerHours.volunteerId, volunteers.id))
        .innerJoin(users, eq(volunteers.userId, users.id))
        .where(eq(volunteerHours.status, "pending"))
        .orderBy(desc(volunteerHours.date))
        .limit(5),

      db
        .select({
          volunteerId: volunteers.id,
          firstName: users.firstName,
          lastName: users.lastName,
          rsvpAt: volunteerRsvps.rsvpAt,
        })
        .from(volunteerRsvps)
        .innerJoin(volunteers, eq(volunteerRsvps.volunteerId, volunteers.id))
        .innerJoin(users, eq(volunteers.userId, users.id))
        .where(eq(volunteerRsvps.status, "confirmed"))
        .orderBy(desc(volunteerRsvps.rsvpAt))
        .limit(5),
    ]),
  ]);

  const activeVolunteerCount = toNumber(volunteersCount[0]?.count);

  // Two-step onboarding completeness calculation
  const totalRequiredRows = await db
    .select({ count: sql<string>`count(*)` })
    .from(onboardingDocuments)
    .where(
      and(
        eq(onboardingDocuments.required, true),
        eq(onboardingDocuments.isActive, true),
      ),
    );
  const totalRequired = toNumber(totalRequiredRows[0]?.count);

  let onboardingIncomplete = 0;
  if (totalRequired > 0) {
    const completeRows = await db
      .select({ volunteerId: volunteerDocumentSignatures.volunteerId })
      .from(volunteerDocumentSignatures)
      .innerJoin(
        onboardingDocuments,
        and(
          eq(volunteerDocumentSignatures.documentId, onboardingDocuments.id),
          eq(onboardingDocuments.required, true),
          eq(onboardingDocuments.isActive, true),
        ),
      )
      .groupBy(volunteerDocumentSignatures.volunteerId)
      .having(sql`count(*) >= ${totalRequired}`);
    onboardingIncomplete = activeVolunteerCount - completeRows.length;
  }

  const allActivity: RecentActivityItem[] = [
    ...newVolunteerRows.map((row) => ({
      type: "new_volunteer" as const,
      label: `${row.firstName} ${row.lastName} joined as a volunteer`,
      timestamp: new Date(row.createdAt).toISOString(),
      href: `/staff/volunteers/${row.volunteerId}`,
    })),
    ...hoursActivityRows.map((row) => ({
      type: "hours_submitted" as const,
      label: `${row.firstName} ${row.lastName} logged ${row.hours} hrs`,
      timestamp: new Date(row.date).toISOString(),
      href: `/staff/volunteers/${row.volunteerId}`,
    })),
    ...rsvpActivityRows.map((row) => ({
      type: "rsvp_confirmed" as const,
      label: `${row.firstName} ${row.lastName} confirmed an RSVP`,
      timestamp: new Date(row.rsvpAt).toISOString(),
      href: `/staff/volunteers/${row.volunteerId}`,
    })),
  ];

  const recentActivity = allActivity
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, RECENT_ACTIVITY_LIMIT);

  return {
    activeVolunteers: activeVolunteerCount,
    totalVolunteerHours: Math.round(
      toNumber(volunteerHoursAggregate[0]?.total ?? "0"),
    ),
    upcomingOpportunities: toNumber(opportunitiesCount[0]?.count),
    pendingRsvps: toNumber(volunteerRsvpsCount[0]?.count),
    upcomingList: upcomingRows.map((row) => ({
      id: row.id,
      title: row.title,
      startDate: new Date(row.startDate).toISOString(),
      location: row.location,
    })),
    pendingHoursCount: toNumber(pendingHoursCountRows[0]?.count),
    onboardingIncomplete,
    pendingHoursList: pendingHoursRows.map((row) => ({
      id: row.id,
      volunteerName: `${row.firstName} ${row.lastName}`,
      volunteerId: row.volunteerId,
      hours: row.hours,
      date: new Date(row.date).toISOString(),
    })),
    pendingRsvpsList: pendingRsvpsRows.map((row) => ({
      volunteerId: row.volunteerId,
      volunteerName: `${row.firstName} ${row.lastName}`,
      opportunityId: row.opportunityId,
      opportunityTitle: row.opportunityTitle,
      rsvpAt: new Date(row.rsvpAt).toISOString(),
    })),
    recentActivity,
  };
}

export async function getVolunteerDashboard(
  volunteerId: number,
): Promise<VolunteerDashboard> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [upcoming, verifiedAgg, pendingAgg, monthlyVerifiedAgg] =
    await Promise.all([
      db
        .select({
          rsvpStatus: volunteerRsvps.status,
          opportunityId: opportunities.id,
          opportunityStartDate: opportunities.startDate,
        })
        .from(volunteerRsvps)
        .innerJoin(
          opportunities,
          eq(volunteerRsvps.opportunityId, opportunities.id),
        )
        .where(
          and(
            eq(volunteerRsvps.volunteerId, volunteerId),
            gte(opportunities.startDate, now),
          ),
        )
        .orderBy(opportunities.startDate)
        .limit(DEFAULT_PAGE_SIZE),

      // VERIFIED = approved + previously-approved portion of edit_requested entries
      db
        .select({
          total: sql<string>`coalesce(sum(case
          when ${volunteerHours.status} = 'approved' then ${volunteerHours.hours}
          when ${volunteerHours.status} = 'edit_requested' then coalesce(${volunteerHours.previousHours}, ${volunteerHours.hours})
          else 0
        end), 0)`,
        })
        .from(volunteerHours)
        .where(eq(volunteerHours.volunteerId, volunteerId)),

      // PENDING = pending entries + extra hours above approved baseline in edit_requested entries
      db
        .select({
          total: sql<string>`coalesce(sum(case
          when ${volunteerHours.status} = 'pending' then ${volunteerHours.hours}
          when ${volunteerHours.status} = 'edit_requested'
               and ${volunteerHours.previousHours} is not null
               and ${volunteerHours.hours} > ${volunteerHours.previousHours}
               then ${volunteerHours.hours} - ${volunteerHours.previousHours}
          else 0
        end), 0)`,
        })
        .from(volunteerHours)
        .where(eq(volunteerHours.volunteerId, volunteerId)),

      // MONTHLY VERIFIED = approved/edit_requested hours logged this calendar month
      db
        .select({
          total: sql<string>`coalesce(sum(case
          when ${volunteerHours.status} = 'approved' then ${volunteerHours.hours}
          when ${volunteerHours.status} = 'edit_requested' then coalesce(${volunteerHours.previousHours}, ${volunteerHours.hours})
          else 0
        end), 0)`,
        })
        .from(volunteerHours)
        .where(
          and(
            eq(volunteerHours.volunteerId, volunteerId),
            gte(volunteerHours.date, monthStart),
          ),
        ),
    ]);

  const verified = toNumber(verifiedAgg[0]?.total);
  const pending = toNumber(pendingAgg[0]?.total);
  const monthlyVerified = toNumber(monthlyVerifiedAgg[0]?.total);

  return {
    upcomingRsvps: upcoming.map((row) => ({
      status: String(row.rsvpStatus),
      opportunity: {
        id: String(row.opportunityId),
        startDate: new Date(row.opportunityStartDate).toISOString(),
      },
    })),
    hours: {
      verified,
      pending,
      total: verified + pending,
      monthlyVerified,
    },
  };
}
