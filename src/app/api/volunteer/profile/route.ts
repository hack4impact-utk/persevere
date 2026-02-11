import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import {
  interests,
  skills,
  users,
  volunteerInterests,
  volunteers,
  volunteerSkills,
} from "@/db/schema";
import {
  opportunities,
  volunteerHours,
  volunteerRsvps,
} from "@/db/schema/opportunities";
import { requireAuth } from "@/utils/auth";
import handleError from "@/utils/handle-error";

// Volunteer self-update schema - restricted fields only
const volunteerSelfUpdateSchema = z.object({
  phone: z.string().optional(),
  bio: z.string().optional(),
  availability: z
    .record(
      z.string(),
      z.union([z.string(), z.array(z.string()), z.boolean(), z.number()]),
    )
    .optional(),
  notificationPreference: z.enum(["email", "sms", "both", "none"]).optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    // Require volunteer role
    const session = await requireAuth();
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get volunteerId from session
    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { message: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const volunteer = await db
      .select()
      .from(volunteers)
      .leftJoin(users, eq(volunteers.userId, users.id))
      .where(eq(volunteers.id, volunteerId));

    if (volunteer.length === 0) {
      return NextResponse.json(
        { message: "Volunteer not found" },
        { status: 404 },
      );
    }

    // Calculate total hours
    const hoursResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${volunteerHours.hours}), 0)`,
      })
      .from(volunteerHours)
      .where(eq(volunteerHours.volunteerId, volunteerId));

    const totalHours =
      typeof hoursResult[0]?.total === "number" ? hoursResult[0].total : 0;

    // Fetch skills with proficiency levels
    const volunteerSkillsData = await db
      .select({
        skillId: volunteerSkills.skillId,
        skillName: skills.name,
        skillDescription: skills.description,
        skillCategory: skills.category,
        proficiencyLevel: volunteerSkills.level,
      })
      .from(volunteerSkills)
      .leftJoin(skills, eq(volunteerSkills.skillId, skills.id))
      .where(eq(volunteerSkills.volunteerId, volunteerId));

    // Fetch interests
    const volunteerInterestsData = await db
      .select({
        interestId: volunteerInterests.interestId,
        interestName: interests.name,
        interestDescription: interests.description,
      })
      .from(volunteerInterests)
      .leftJoin(interests, eq(volunteerInterests.interestId, interests.id))
      .where(eq(volunteerInterests.volunteerId, volunteerId));

    // Fetch recent opportunities (last 5)
    const recentOpportunities = await db
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
      .limit(5);

    // Fetch hours breakdown (last 10 entries)
    const hoursBreakdown = await db
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
      .limit(10);

    const volunteerData = volunteer[0];
    if (!volunteerData) {
      return NextResponse.json(
        { message: "Volunteer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        volunteers: volunteerData.volunteers,
        users: volunteerData.users,
        totalHours,
        skills: volunteerSkillsData,
        interests: volunteerInterestsData,
        recentOpportunities,
        hoursBreakdown,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    // Require volunteer role
    const session = await requireAuth();
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get volunteerId from session
    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { message: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const json = await request.json();

    // Validate the request body with restricted fields
    const result = volunteerSelfUpdateSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const data = result.data;

    const volunteer = await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.id, volunteerId));

    if (volunteer.length === 0) {
      return NextResponse.json(
        { message: "Volunteer not found" },
        { status: 404 },
      );
    }

    // Build update objects - only allowed fields
    const userData: {
      phone?: string;
      bio?: string;
    } = {};
    const volunteerData: {
      availability?: Record<string, unknown>;
      notificationPreference?: "email" | "sms" | "both" | "none";
    } = {};

    if (data.phone !== undefined) userData.phone = data.phone;
    if (data.bio !== undefined) userData.bio = data.bio;

    if (data.availability !== undefined)
      volunteerData.availability = data.availability;
    if (data.notificationPreference !== undefined)
      volunteerData.notificationPreference = data.notificationPreference;

    // Update user table if there are user fields
    if (Object.keys(userData).length > 0) {
      await db
        .update(users)
        .set(userData)
        .where(eq(users.id, volunteer[0].userId));
    }

    // Update volunteer table if there are volunteer fields
    if (Object.keys(volunteerData).length > 0) {
      await db
        .update(volunteers)
        .set(volunteerData)
        .where(eq(volunteers.id, volunteerId));
    }

    // Fetch updated volunteer data
    const updatedVolunteer = await db
      .select()
      .from(volunteers)
      .leftJoin(users, eq(volunteers.userId, users.id))
      .where(eq(volunteers.id, volunteerId));

    return NextResponse.json({
      message: "Profile updated successfully",
      data: updatedVolunteer[0],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
