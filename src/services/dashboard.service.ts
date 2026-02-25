import { and, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";

import db from "@/db";
import {
  opportunities,
  users,
  volunteerHours,
  volunteerRsvps,
  volunteers,
} from "@/db/schema";

export type StaffDashboardStats = {
  activeVolunteers: number;
  totalVolunteerHours: number;
  upcomingOpportunities: number;
  pendingRsvps: number;
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
  ]);

  return {
    activeVolunteers: Number(volunteersCount[0]?.count ?? 0),
    totalVolunteerHours: Number(volunteerHoursAggregate[0]?.total ?? 0),
    upcomingOpportunities: Number(opportunitiesCount[0]?.count ?? 0),
    pendingRsvps: Number(volunteerRsvpsCount[0]?.count ?? 0),
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
      .limit(10),

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

  const verified = Number(verifiedAgg[0]?.total ?? 0);
  const pending = Number(pendingAgg[0]?.total ?? 0);

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
