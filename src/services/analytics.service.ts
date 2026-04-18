import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";

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
  attendanceRate: number; // attended RSVPs / (attended + no_show) RSVPs (0–1)
  hoursByMonth: { month: string; hours: number }[];
  topVolunteers: { name: string; hours: number }[];
  hoursByLocation: { location: string; hours: number }[];
  hoursByVolunteerType: { volunteerType: string; hours: number }[];
};

export type MonthlyExportRow = {
  month: string;
  verifiedHours: number;
  uniqueVolunteers: number;
  newVolunteers: number;
  eventsHeld: number;
  attendanceRate: string;
  hoursByType: Record<string, number>;
};

export type MonthlyExportData = {
  volunteerTypes: string[];
  rows: MonthlyExportRow[];
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

    // Attendance rate: attended vs (attended + no_show) RSVPs (filtered by opportunity date)
    db
      .select({
        total: sql<string>`count(*) filter (where ${volunteerRsvps.status} in ('attended', 'no_show'))`,
        attended: sql<string>`count(*) filter (where ${volunteerRsvps.status} = 'attended')`,
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

  const trackedRsvps = toNumber(rsvpAgg[0]?.total);
  const attended = toNumber(rsvpAgg[0]?.attended);

  return {
    totalHours: toNumber(hoursAgg[0]?.total),
    totalVolunteers: toNumber(volunteersCount[0]?.count),
    attendanceRate: trackedRsvps > 0 ? attended / trackedRsvps : 0,
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

export async function getMonthlyExportData(
  startDate?: string,
  endDate?: string,
): Promise<MonthlyExportData> {
  const hoursDateFilter = and(
    startDate ? gte(volunteerHours.date, new Date(startDate)) : undefined,
    endDate ? lte(volunteerHours.date, new Date(endDate)) : undefined,
  );

  const oppDateFilter = and(
    startDate ? gte(opportunities.startDate, new Date(startDate)) : undefined,
    endDate ? lte(opportunities.startDate, new Date(endDate)) : undefined,
  );

  const volunteerCreatedFilter = and(
    startDate ? gte(volunteers.createdAt, new Date(startDate)) : undefined,
    endDate ? lte(volunteers.createdAt, new Date(endDate)) : undefined,
  );

  const [
    hoursRows,
    rsvpRows,
    eventsRows,
    newVolRows,
    hoursByTypeRows,
    typeRows,
  ] = await Promise.all([
    // Hours metrics grouped by the month hours were logged
    db
      .select({
        month: sql<string>`to_char(${volunteerHours.date}, 'YYYY-MM')`,
        verifiedHours: sql<string>`coalesce(sum(${volunteerHours.hours}) filter (where ${volunteerHours.status} = 'approved'), 0)`,
        uniqueVolunteers: sql<string>`count(distinct ${volunteerHours.volunteerId})`,
      })
      .from(volunteerHours)
      .where(hoursDateFilter)
      .groupBy(sql`to_char(${volunteerHours.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${volunteerHours.date}, 'YYYY-MM')`),

    // RSVP metrics grouped by the month the event occurred
    db
      .select({
        month: sql<string>`to_char(${opportunities.startDate}, 'YYYY-MM')`,
        tracked: sql<string>`count(*) filter (where ${volunteerRsvps.status} in ('attended', 'no_show'))`,
        attended: sql<string>`count(*) filter (where ${volunteerRsvps.status} = 'attended')`,
      })
      .from(volunteerRsvps)
      .innerJoin(
        opportunities,
        eq(volunteerRsvps.opportunityId, opportunities.id),
      )
      .where(oppDateFilter)
      .groupBy(sql`to_char(${opportunities.startDate}, 'YYYY-MM')`),

    // Events held + total capacity by month
    db
      .select({
        month: sql<string>`to_char(${opportunities.startDate}, 'YYYY-MM')`,
        eventsHeld: sql<string>`count(*)`,
      })
      .from(opportunities)
      .where(oppDateFilter)
      .groupBy(sql`to_char(${opportunities.startDate}, 'YYYY-MM')`),

    // New volunteer registrations by month
    db
      .select({
        month: sql<string>`to_char(${volunteers.createdAt}, 'YYYY-MM')`,
        newVolunteers: sql<string>`count(*)`,
      })
      .from(volunteers)
      .where(volunteerCreatedFilter)
      .groupBy(sql`to_char(${volunteers.createdAt}, 'YYYY-MM')`),

    // Hours by volunteer type by month
    db
      .select({
        month: sql<string>`to_char(${volunteerHours.date}, 'YYYY-MM')`,
        volunteerType: sql<string>`coalesce(${volunteers.volunteerType}, 'Unspecified')`,
        hours: sql<string>`coalesce(sum(${volunteerHours.hours}), 0)`,
      })
      .from(volunteerHours)
      .innerJoin(volunteers, eq(volunteerHours.volunteerId, volunteers.id))
      .where(hoursDateFilter)
      .groupBy(
        sql`to_char(${volunteerHours.date}, 'YYYY-MM')`,
        sql`coalesce(${volunteers.volunteerType}, 'Unspecified')`,
      ),

    // All distinct volunteer types for consistent column headers
    db
      .selectDistinct({ volunteerType: volunteers.volunteerType })
      .from(volunteers)
      .where(isNotNull(volunteers.volunteerType))
      .orderBy(volunteers.volunteerType),
  ]);

  const volunteerTypes = typeRows.map((r) => r.volunteerType as string);

  // Build lookup maps by month
  const rsvpByMonth = new Map(
    rsvpRows.map((r) => [
      r.month,
      { tracked: toNumber(r.tracked), attended: toNumber(r.attended) },
    ]),
  );

  const eventsByMonth = new Map(
    eventsRows.map((r) => [r.month, toNumber(r.eventsHeld)]),
  );

  const newVolByMonth = new Map(
    newVolRows.map((r) => [r.month, toNumber(r.newVolunteers)]),
  );

  // Build nested map: month → volunteerType → hours
  const typeHoursByMonth = new Map<string, Map<string, number>>();
  for (const r of hoursByTypeRows) {
    if (!typeHoursByMonth.has(r.month)) {
      typeHoursByMonth.set(r.month, new Map());
    }
    typeHoursByMonth.get(r.month)!.set(r.volunteerType, toNumber(r.hours));
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Collect all months across all queries, sorted, capped at current month
  const allMonths = [
    ...new Set([
      ...hoursRows.map((r) => r.month),
      ...rsvpRows.map((r) => r.month),
      ...eventsRows.map((r) => r.month),
      ...newVolRows.map((r) => r.month),
    ]),
  ]
    .sort()
    .filter((m) => m <= currentMonth);

  const hoursMap = new Map(hoursRows.map((r) => [r.month, r]));

  const rows: MonthlyExportRow[] = allMonths.map((month) => {
    const h = hoursMap.get(month);
    const rsvp = rsvpByMonth.get(month);
    const typeHours = typeHoursByMonth.get(month) ?? new Map<string, number>();

    const tracked = rsvp?.tracked ?? 0;
    const attended = rsvp?.attended ?? 0;
    const attendanceRate =
      tracked > 0 ? `${((attended / tracked) * 100).toFixed(1)}%` : "N/A";

    const hoursByType: Record<string, number> = {};
    for (const type of volunteerTypes) {
      hoursByType[type] = typeHours.get(type) ?? 0;
    }

    return {
      month,
      verifiedHours: toNumber(h?.verifiedHours),
      uniqueVolunteers: toNumber(h?.uniqueVolunteers),
      newVolunteers: newVolByMonth.get(month) ?? 0,
      eventsHeld: eventsByMonth.get(month) ?? 0,
      attendanceRate,
      hoursByType,
    };
  });

  return { volunteerTypes, rows };
}
