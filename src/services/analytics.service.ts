import { and, eq, gte, lte, sql } from "drizzle-orm";

import db from "@/db";
import {
  opportunities,
  users,
  volunteerHours,
  volunteerRsvps,
  volunteers,
} from "@/db/schema";
import { toNumber } from "@/services/shared/db-helpers";

export type AnalyticsStats = {
  totalHours: number;
  totalVolunteers: number;
  attendanceRate: number; // confirmed RSVPs / total RSVPs (0–1)
  hoursByMonth: { month: string; hours: number }[];
  topVolunteers: { name: string; hours: number }[];
  hoursByLocation: { location: string; hours: number }[];
  hoursByVolunteerType: { volunteerType: string; hours: number }[];
};

export type ExportRow = {
  name: string;
  totalHours: number;
  verifiedHours: number;
  eventsAttended: number;
  volunteerType: string;
};

export async function getAnalyticsStats(
  startDate?: string,
  endDate?: string,
): Promise<AnalyticsStats> {
  // Optional date filter on volunteer_hours.date
  const hoursDateFilter = and(
    startDate ? gte(volunteerHours.date, new Date(startDate)) : undefined,
    endDate ? lte(volunteerHours.date, new Date(endDate)) : undefined,
  );

  // Optional date filter on opportunities.start_date (for attendance rate)
  const oppDateFilter = and(
    startDate ? gte(opportunities.startDate, new Date(startDate)) : undefined,
    endDate ? lte(opportunities.startDate, new Date(endDate)) : undefined,
  );

  const [
    hoursAgg,
    volunteersCount,
    rsvpAgg,
    hoursByMonthRows,
    topVolunteersRows,
    hoursByLocationRows,
    hoursByVolunteerTypeRows,
  ] = await Promise.all([
    // Total hours logged (filtered by date)
    db
      .select({
        total: sql<string>`coalesce(sum(${volunteerHours.hours}), 0)`,
      })
      .from(volunteerHours)
      .where(hoursDateFilter),

    // Active volunteers (no date filter — this is a snapshot)
    db
      .select({ count: sql<string>`count(*)` })
      .from(volunteers)
      .innerJoin(users, eq(volunteers.userId, users.id))
      .where(eq(users.isActive, true)),

    // Attendance rate: confirmed vs total RSVPs (filtered by opportunity date)
    db
      .select({
        total: sql<string>`count(*)`,
        confirmed: sql<string>`count(*) filter (where ${volunteerRsvps.status} = 'confirmed')`,
      })
      .from(volunteerRsvps)
      .innerJoin(
        opportunities,
        eq(volunteerRsvps.opportunityId, opportunities.id),
      )
      .where(oppDateFilter),

    // Hours grouped by month (YYYY-MM), sorted ascending
    db
      .select({
        month: sql<string>`to_char(${volunteerHours.date}, 'YYYY-MM')`,
        hours: sql<string>`coalesce(sum(${volunteerHours.hours}), 0)`,
      })
      .from(volunteerHours)
      .where(hoursDateFilter)
      .groupBy(sql`to_char(${volunteerHours.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${volunteerHours.date}, 'YYYY-MM')`),

    // Top 5 volunteers by hours
    db
      .select({
        name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        hours: sql<string>`coalesce(sum(${volunteerHours.hours}), 0)`,
      })
      .from(volunteerHours)
      .innerJoin(volunteers, eq(volunteerHours.volunteerId, volunteers.id))
      .innerJoin(users, eq(volunteers.userId, users.id))
      .where(hoursDateFilter)
      .groupBy(volunteerHours.volunteerId, users.firstName, users.lastName)
      .orderBy(sql`sum(${volunteerHours.hours}) desc`)
      .limit(5),

    // Hours grouped by opportunity location
    db
      .select({
        location: opportunities.location,
        hours: sql<string>`coalesce(sum(${volunteerHours.hours}), 0)`,
      })
      .from(volunteerHours)
      .innerJoin(
        opportunities,
        eq(volunteerHours.opportunityId, opportunities.id),
      )
      .where(hoursDateFilter)
      .groupBy(opportunities.location),

    // Hours grouped by volunteer type (null → "Unspecified")
    db
      .select({
        volunteerType: sql<string>`coalesce(${volunteers.volunteerType}, 'Unspecified')`,
        hours: sql<string>`coalesce(sum(${volunteerHours.hours}), 0)`,
      })
      .from(volunteerHours)
      .innerJoin(volunteers, eq(volunteerHours.volunteerId, volunteers.id))
      .where(hoursDateFilter)
      .groupBy(sql`coalesce(${volunteers.volunteerType}, 'Unspecified')`),
  ]);

  const total = toNumber(rsvpAgg[0]?.total);
  const confirmed = toNumber(rsvpAgg[0]?.confirmed);

  return {
    totalHours: toNumber(hoursAgg[0]?.total),
    totalVolunteers: toNumber(volunteersCount[0]?.count),
    attendanceRate: total > 0 ? confirmed / total : 0,
    hoursByMonth: hoursByMonthRows.map((r) => ({
      month: r.month,
      hours: toNumber(r.hours),
    })),
    topVolunteers: topVolunteersRows.map((r) => ({
      name: r.name,
      hours: toNumber(r.hours),
    })),
    hoursByLocation: hoursByLocationRows.map((r) => ({
      location: r.location,
      hours: toNumber(r.hours),
    })),
    hoursByVolunteerType: hoursByVolunteerTypeRows.map((r) => ({
      volunteerType: r.volunteerType,
      hours: toNumber(r.hours),
    })),
  };
}

export async function getExportData(
  startDate?: string,
  endDate?: string,
): Promise<ExportRow[]> {
  const hoursDateFilter = and(
    startDate ? gte(volunteerHours.date, new Date(startDate)) : undefined,
    endDate ? lte(volunteerHours.date, new Date(endDate)) : undefined,
  );

  const rows = await db
    .select({
      name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      totalHours: sql<string>`coalesce(sum(${volunteerHours.hours}), 0)`,
      verifiedHours: sql<string>`coalesce(sum(${volunteerHours.hours}) filter (where ${volunteerHours.verifiedAt} is not null), 0)`,
      eventsAttended: sql<string>`count(distinct ${volunteerHours.opportunityId})`,
      volunteerType: sql<string>`coalesce(max(${volunteers.volunteerType}), 'Unspecified')`,
    })
    .from(volunteerHours)
    .innerJoin(volunteers, eq(volunteerHours.volunteerId, volunteers.id))
    .innerJoin(users, eq(volunteers.userId, users.id))
    .where(hoursDateFilter)
    .groupBy(volunteerHours.volunteerId, users.firstName, users.lastName)
    .orderBy(users.lastName, users.firstName);

  return rows.map((r) => ({
    name: r.name,
    totalHours: toNumber(r.totalHours),
    verifiedHours: toNumber(r.verifiedHours),
    eventsAttended: toNumber(r.eventsAttended),
    volunteerType: r.volunteerType,
  }));
}
