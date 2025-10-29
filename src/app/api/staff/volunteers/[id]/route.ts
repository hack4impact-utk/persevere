import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import { users, volunteers } from "@/db/schema";
import handleError from "@/utils/handle-error";

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
  availability: z.record(z.string(), z.any()).optional(),
  notificationPreference: z.enum(["email", "sms", "both", "none"]).optional(),
});

/**
 * Validates and parses a volunteer ID from a string parameter.
 * Returns null if the ID is invalid (not a positive integer).
 */
function validateAndParseId(id: string): number | null {
  // Check if the ID is a non-empty string of digits
  if (!/^\d+$/.test(id)) {
    return null;
  }

  const parsed = Number.parseInt(id, 10);

  // Ensure it's a valid positive integer
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const volunteerId = Number.parseInt(params.id, 10);

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

    return NextResponse.json({ data: volunteer[0] });
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const volunteerId = validateAndParseId(params.id);

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
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const volunteerId = Number(params.id);
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
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
