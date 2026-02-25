import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getVolunteerProfile,
  updateVolunteerProfile,
} from "@/services/volunteer.service";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

const timeRangeSchema = z
  .object({
    start: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)"),
    end: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)"),
  })
  .refine((data) => data.start < data.end, {
    message: "Start time must be before end time",
  });

// Per-day availability: each day is optional; if present, must be a valid array of ranges.
// z.record(z.enum(...)) requires ALL enum keys in Zod v4, so use z.object instead.
const availabilitySchema = z.object({
  monday: z.array(timeRangeSchema).optional(),
  tuesday: z.array(timeRangeSchema).optional(),
  wednesday: z.array(timeRangeSchema).optional(),
  thursday: z.array(timeRangeSchema).optional(),
  friday: z.array(timeRangeSchema).optional(),
  saturday: z.array(timeRangeSchema).optional(),
  sunday: z.array(timeRangeSchema).optional(),
});

// Volunteer self-update schema - restricted fields only
const volunteerSelfUpdateSchema = z.object({
  phone: z.string().max(20).optional(),
  bio: z.string().max(2000).optional(),
  availability: availabilitySchema.optional(),
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

    const result = await getVolunteerProfile(volunteerId);

    if (result === null) {
      return NextResponse.json(
        { message: "Volunteer not found" },
        { status: 404 },
      );
    }

    const { volunteer: volunteerData, ...rest } = result;

    if (!volunteerData) {
      return NextResponse.json(
        { message: "Volunteer not found" },
        { status: 404 },
      );
    }
    if (!volunteerData.users) {
      console.error(
        `[GET /api/volunteer/profile] Volunteer ${volunteerId} has no associated user record — data integrity issue`,
      );
      return NextResponse.json(
        { message: "Your account data is incomplete. Please contact support." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        volunteers: volunteerData.volunteers,
        users: volunteerData.users,
        ...rest,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.code }, { status });
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

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body: expected JSON" },
        { status: 400 },
      );
    }

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

    const updatedVolunteer = await updateVolunteerProfile({
      volunteerId,
      phone: data.phone,
      bio: data.bio,
      availability: data.availability,
      notificationPreference: data.notificationPreference,
    });

    if (updatedVolunteer === null) {
      return NextResponse.json(
        { message: "Volunteer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      data: updatedVolunteer,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.code }, { status });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
