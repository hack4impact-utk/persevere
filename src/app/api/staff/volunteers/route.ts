import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import { users, volunteers } from "@/db/schema";
import { sendWelcomeEmail } from "@/utils/email";
import handleError from "@/utils/handle-error";
import { generateSecurePassword, hashPassword } from "@/utils/password";

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
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const alumni = searchParams.get("alumni");

    const offset = (page - 1) * limit;

    const whereClauses = [];
    if (search) {
      whereClauses.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`),
        ),
      );
    }
    if (type) {
      whereClauses.push(eq(volunteers.volunteerType, type));
    }
    if (alumni) {
      whereClauses.push(eq(volunteers.isAlumni, alumni === "true"));
    }

    // Build volunteer list query conditionally
    const baseQuery = db
      .select()
      .from(volunteers)
      .leftJoin(users, eq(volunteers.userId, users.id));

    const volunteerList = await (whereClauses.length > 0
      ? baseQuery
          .where(and(...whereClauses))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(volunteers.createdAt))
      : baseQuery
          .limit(limit)
          .offset(offset)
          .orderBy(desc(volunteers.createdAt)));

    // Build count query conditionally
    const countBaseQuery = db
      .select({ count: sql<number>`count(${volunteers.id})` })
      .from(volunteers)
      .leftJoin(users, eq(volunteers.userId, users.id));

    const total = await (whereClauses.length > 0
      ? countBaseQuery.where(and(...whereClauses))
      : countBaseQuery);

    const totalCount =
      typeof total[0]?.count === "bigint"
        ? Number(total[0].count)
        : (total[0]?.count ?? 0);

    return NextResponse.json({ data: volunteerList, total: totalCount });
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
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

    // Always generate a secure random password for new volunteers
    // Users can change their password after logging in
    const plainPassword = generateSecurePassword(12);
    const hashedPassword = await hashPassword(plainPassword);

    const newUser = await db
      .insert(users)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        bio: data.bio,
        profilePicture: data.profilePicture,
        isActive: data.isActive ?? true,
        isEmailVerified: false, // Explicitly set to false for new volunteers
      })
      .returning({ id: users.id });

    if (!newUser[0]?.id) {
      throw new Error("Failed to create user");
    }

    const newVolunteer = await db
      .insert(volunteers)
      .values({
        userId: newUser[0].id,
        volunteerType: data.volunteerType,
        isAlumni: data.isAlumni ?? false,
        backgroundCheckStatus: data.backgroundCheckStatus ?? "not_required",
        mediaRelease: data.mediaRelease ?? false,
        availability: data.availability,
        notificationPreference: data.notificationPreference ?? "email",
      })
      .returning();

    // Send welcome email with credentials
    // If email fails, log error but don't fail volunteer creation
    try {
      await sendWelcomeEmail(data.email, data.firstName, plainPassword);
    } catch (emailError) {
      // Log the error but continue - volunteer is already created
      console.error(
        `Failed to send welcome email to ${data.email}:`,
        emailError,
      );
      // Note: We still return success since the volunteer was created successfully
    }

    return NextResponse.json(
      { message: "Volunteer created successfully", data: newVolunteer[0] },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
