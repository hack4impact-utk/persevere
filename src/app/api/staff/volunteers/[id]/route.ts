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
import { validateAndParseId } from "@/utils/validate-id";

const volunteerUpdateSchema = z.object({
  // User fields
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.email("Invalid email address").optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  profilePicture: z.string().optional(),
  isActive: z.boolean().optional(),

  // Volunteer-specific fields
  volunteerType: z.string().optional(),
  isAlumni: z.boolean().optional(),
  backgroundCheckStatus: z
    .enum(["not_required", "pending", "approved", "rejected"])
    .optional(),
  mediaRelease: z.boolean().optional(),
  availability: z
    .record(
      z.string(),
      z.union([z.string(), z.array(z.string()), z.boolean(), z.number()]),
    )
    .optional(),
  notificationPreference: z.enum(["email", "sms", "both", "none"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Require staff or admin role
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const volunteerId = Number.parseInt(id, 10);

    if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
      return NextResponse.json(
        { message: "Invalid volunteer ID" },
        { status: 400 },
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Require staff or admin role
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const volunteerId = validateAndParseId(id);

    if (volunteerId === null) {
      return NextResponse.json(
        { message: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const json = await request.json();

    // Validate the request body with better error handling
    const result = volunteerUpdateSchema.safeParse(json);
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

    const userData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      bio?: string;
      profilePicture?: string;
      isActive?: boolean;
    } = {};
    const volunteerData: {
      volunteerType?: string;
      isAlumni?: boolean;
      backgroundCheckStatus?:
        | "not_required"
        | "pending"
        | "approved"
        | "rejected";
      mediaRelease?: boolean;
      availability?: Record<string, unknown>;
      notificationPreference?: "email" | "sms" | "both" | "none";
    } = {};

    if (data.firstName) userData.firstName = data.firstName;
    if (data.lastName) userData.lastName = data.lastName;
    if (data.email) userData.email = data.email;
    if (data.phone !== undefined) userData.phone = data.phone;
    if (data.bio !== undefined) userData.bio = data.bio;
    if (data.profilePicture !== undefined)
      userData.profilePicture = data.profilePicture;
    if (data.isActive !== undefined) userData.isActive = data.isActive;

    if (data.volunteerType !== undefined)
      volunteerData.volunteerType = data.volunteerType;
    if (data.isAlumni !== undefined) volunteerData.isAlumni = data.isAlumni;
    if (data.backgroundCheckStatus !== undefined)
      volunteerData.backgroundCheckStatus = data.backgroundCheckStatus;
    if (data.mediaRelease !== undefined)
      volunteerData.mediaRelease = data.mediaRelease;
    if (data.availability !== undefined)
      volunteerData.availability = data.availability;
    if (data.notificationPreference !== undefined)
      volunteerData.notificationPreference = data.notificationPreference;

    if (Object.keys(userData).length > 0) {
      await db
        .update(users)
        .set(userData)
        .where(eq(users.id, volunteer[0].userId));
    }

    if (Object.keys(volunteerData).length > 0) {
      await db
        .update(volunteers)
        .set(volunteerData)
        .where(eq(volunteers.id, volunteerId));
    }

    const updatedVolunteer = await db
      .select()
      .from(volunteers)
      .leftJoin(users, eq(volunteers.userId, users.id))
      .where(eq(volunteers.id, volunteerId));

    return NextResponse.json({
      message: "Volunteer updated successfully",
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Require staff or admin role
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const volunteerId = Number(id);
    if (!Number.isFinite(volunteerId)) {
      return NextResponse.json(
        { message: "Invalid volunteer id" },
        { status: 400 },
      );
    }
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

    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, volunteer[0].userId))
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Volunteer deleted successfully",
      data: volunteer[0],
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
