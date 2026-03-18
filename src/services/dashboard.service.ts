import { and, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";

import db from "@/db";
import {
  opportunities,
  users,
  volunteerHours,
  volunteerRsvps,
  volunteers,
} from "@/db/schema";
import { DEFAULT_PAGE_SIZE, RECENT_OPPORTUNITIES_LIMIT } from "@/lib/constants";
import { toNumber } from "@/services/shared/db-helpers";

export type StaffUpcomingOpportunity = {
  id: number;
  title: string;
  startDate: string; // ISO string
  location: string;
};

export type StaffDashboardStats = {
  activeVolunteers: number;
  totalVolunteerHours: number;
  upcomingOpportunities: number;
  pendingRsvps: number;
  upcomingList: StaffUpcomingOpportunity[];
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
  ]);

  return {
    activeVolunteers: toNumber(volunteersCount[0]?.count),
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
  };
}

export async function getVolunteerDashboard(
  volunteerId: number,
): Promise<VolunteerDashboard> {
  const now = new Date();

  const [upcoming, verifiedAgg, pendingAgg] = await Promise.all([
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

    // VERIFIED = verifiedAt IS NOT NULL
    db
      .select({
        total: sql<string>`coalesce(sum(${volunteerHours.hours}), 0)`,
      })
      .from(volunteerHours)
      .where(
        and(
          eq(volunteerHours.volunteerId, volunteerId),
          isNotNull(volunteerHours.verifiedAt),
        ),
      ),

    // PENDING = verifiedAt IS NULL
    db
      .select({
        total: sql<string>`coalesce(sum(${volunteerHours.hours}), 0)`,
      })
      .from(volunteerHours)
      .where(
        and(
          eq(volunteerHours.volunteerId, volunteerId),
          isNull(volunteerHours.verifiedAt),
        ),
      ),
  ]);

  const verified = toNumber(verifiedAgg[0]?.total);
  const pending = toNumber(pendingAgg[0]?.total);

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
    },
  };
}
