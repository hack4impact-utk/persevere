import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { createVolunteer, listVolunteers } from "@/services/volunteer.service";
import handleError from "@/utils/handle-error";

const volunteerCreateSchema = z.object({
  // User fields
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  // Password is always auto-generated - not accepted in request
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

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has staff or admin role
    const user = session.user as {
      role?: string;
    };
    if (!user.role || !["staff", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(
      searchParams.get("limit") || String(DEFAULT_PAGE_SIZE),
    );
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const alumni = searchParams.get("alumni");
    const emailVerified = searchParams.get("emailVerified");
    const isActive = searchParams.get("isActive");

    const { data, total } = await listVolunteers({
      page,
      limit,
      search,
      type,
      alumni,
      emailVerified,
      isActive,
    });

    return NextResponse.json({ data, total });
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has staff or admin role
    const user = session.user as {
      role?: string;
    };
    if (!user.role || !["staff", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await request.json();

    // Validate the request body with better error handling
    const result = volunteerCreateSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const data = result.data;

    const { volunteer, emailSent, emailError, backgroundCheckStatus } =
      await createVolunteer(data);

    return NextResponse.json(
      {
        message: "Volunteer created successfully",
        data: volunteer,
        emailSent,
        emailError,
        backgroundCheckStatus,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
