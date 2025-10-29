import { hash } from "bcrypt";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import { users, volunteers } from "@/db/schema";
import handleError from "@/utils/handle-error";

const volunteerCreateSchema = z.object({
  // User fields
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
  availability: z.record(z.string(), z.any()).optional(), // jsonb field
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

    const volunteerList = await db
      .select()
      .from(volunteers)
      .leftJoin(users, eq(volunteers.userId, users.id))
      .where(and(...whereClauses))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(volunteers.createdAt));

    const total = await db
      .select({ count: sql`count(*)` })
      .from(volunteers)
      .leftJoin(users, eq(volunteers.userId, users.id))
      .where(and(...whereClauses));

    return NextResponse.json({ data: volunteerList, total: total[0].count });
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

    const hashedPassword = await hash(data.password, 10);

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

    return NextResponse.json(
      { message: "Volunteer created successfully", data: newVolunteer[0] },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
