/**
 * Shared volunteer detail data fetcher.
 *
 * Extracts the parallel data queries (skills, interests, hours, RSVPs) shared by
 * volunteer.service.ts (self-service profile) and volunteer-detail.service.ts (staff view).
 */
import { desc, eq, sql } from "drizzle-orm";

import db from "@/db";
import {
  interests,
  skills,
  volunteerInterests,
  volunteerSkills,
} from "@/db/schema";
import {
  opportunities,
  volunteerHours,
  volunteerRsvps,
} from "@/db/schema/opportunities";
import { DEFAULT_PAGE_SIZE, RECENT_OPPORTUNITIES_LIMIT } from "@/lib/constants";

import { toNumber } from "./db-helpers";

export type VolunteerDetailData = {
  totalHours: number;
  skills: {
    skillId: number;
    skillName: string | null;
    skillDescription: string | null;
    skillCategory: string | null;
    proficiencyLevel: "beginner" | "intermediate" | "advanced";
  }[];
  interests: {
    interestId: number;
    interestName: string | null;
    interestDescription: string | null;
  }[];
  recentOpportunities: {
    opportunityId: number;
    opportunityTitle: string | null;
    opportunityLocation: string | null;
    opportunityStartDate: Date | null;
    opportunityEndDate: Date | null;
    rsvpStatus: "pending" | "confirmed" | "declined" | "attended" | "no_show";
    rsvpAt: Date;
    rsvpNotes: string | null;
  }[];
  hoursBreakdown: {
    id: number;
    opportunityId: number;
    opportunityTitle: string | null;
    date: Date;
    hours: number;
    notes: string | null;
    verifiedAt: Date | null;
  }[];
};

/**
 * Fetches the detail data for a volunteer in parallel: total hours, skills,
 * interests, recent RSVPs, and hours breakdown.
 */
export async function fetchVolunteerDetailData(
  volunteerId: number,
): Promise<VolunteerDetailData> {
  const [
    hoursResult,
    volunteerSkillsData,
    volunteerInterestsData,
    recentOpportunities,
    hoursBreakdown,
  ] = await Promise.all([
    db
      .select({ total: sql<number>`COALESCE(SUM(${volunteerHours.hours}), 0)` })
      .from(volunteerHours)
      .where(eq(volunteerHours.volunteerId, volunteerId)),

    db
      .select({
        skillId: volunteerSkills.skillId,
        skillName: skills.name,
        skillDescription: skills.description,
        skillCategory: skills.category,
        proficiencyLevel: volunteerSkills.level,
      })
      .from(volunteerSkills)
      .leftJoin(skills, eq(volunteerSkills.skillId, skills.id))
      .where(eq(volunteerSkills.volunteerId, volunteerId)),

    db
      .select({
        interestId: volunteerInterests.interestId,
        interestName: interests.name,
        interestDescription: interests.description,
      })
      .from(volunteerInterests)
      .leftJoin(interests, eq(volunteerInterests.interestId, interests.id))
      .where(eq(volunteerInterests.volunteerId, volunteerId)),

    db
      .select({
        opportunityId: volunteerRsvps.opportunityId,
        opportunityTitle: opportunities.title,
        opportunityLocation: opportunities.location,
        opportunityStartDate: opportunities.startDate,
        opportunityEndDate: opportunities.endDate,
        rsvpStatus: volunteerRsvps.status,
        rsvpAt: volunteerRsvps.rsvpAt,
        rsvpNotes: volunteerRsvps.notes,
      })
      .from(volunteerRsvps)
      .leftJoin(
        opportunities,
        eq(volunteerRsvps.opportunityId, opportunities.id),
      )
      .where(eq(volunteerRsvps.volunteerId, volunteerId))
      .orderBy(desc(volunteerRsvps.rsvpAt))
      .limit(RECENT_OPPORTUNITIES_LIMIT),

    db
      .select({
        id: volunteerHours.id,
        opportunityId: volunteerHours.opportunityId,
        opportunityTitle: opportunities.title,
        date: volunteerHours.date,
        hours: volunteerHours.hours,
        notes: volunteerHours.notes,
        verifiedAt: volunteerHours.verifiedAt,
      })
      .from(volunteerHours)
      .leftJoin(
        opportunities,
        eq(volunteerHours.opportunityId, opportunities.id),
      )
      .where(eq(volunteerHours.volunteerId, volunteerId))
      .orderBy(desc(volunteerHours.date))
      .limit(DEFAULT_PAGE_SIZE),
  ]);

  return {
    totalHours: toNumber(hoursResult[0]?.total),
    skills: volunteerSkillsData,
    interests: volunteerInterestsData,
    recentOpportunities,
    hoursBreakdown,
  };
}
