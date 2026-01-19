import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import db from "@/db";
import { admin, staff, users } from "@/db/schema";
import { sendWelcomeEmail } from "@/utils/email";
import handleError from "@/utils/handle-error";
import { generateSecurePassword, hashPassword } from "@/utils/password";

const staffCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can access staff list
    const user = session.user as {
      role?: string;
    };
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const emailVerified = searchParams.get("emailVerified");
    const role = searchParams.get("role");

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
    if (isActive !== null) {
      whereClauses.push(eq(users.isActive, isActive === "true"));
    }
    if (emailVerified !== null) {
      whereClauses.push(eq(users.isEmailVerified, emailVerified === "true"));
    }

    // Filter by role (admin vs staff) - need to check admin table
    const needsRoleFilter = role === "admin" || role === "staff";

    // Build staff list query
    const baseQuery = db
      .select({
        staff: {
          id: staff.id,
          userId: staff.userId,
          notificationPreference: staff.notificationPreference,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
        },
        users: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          isActive: users.isActive,
          isEmailVerified: users.isEmailVerified,
          profilePicture: users.profilePicture,
          createdAt: users.createdAt,
        },
        adminId: admin.id,
      })
      .from(staff)
      .leftJoin(users, eq(staff.userId, users.id))
      .leftJoin(admin, eq(staff.id, admin.staffId))
      .orderBy(desc(users.createdAt));

    // Apply role filter if needed
    let filteredQuery = baseQuery;
    if (needsRoleFilter) {
      if (role === "admin") {
        // Only show admins (where admin.id is not null)
        filteredQuery = baseQuery.where(
          and(...whereClauses, sql`${admin.id} IS NOT NULL`),
        ) as typeof baseQuery;
      } else if (role === "staff") {
        // Only show staff (where admin.id is null)
        filteredQuery = baseQuery.where(
          and(...whereClauses, sql`${admin.id} IS NULL`),
        ) as typeof baseQuery;
      }
    } else if (whereClauses.length > 0) {
      filteredQuery = baseQuery.where(and(...whereClauses)) as typeof baseQuery;
    }

    const staffListRaw = await filteredQuery.limit(limit).offset(offset);

    // Get total count with same filters
    const countQuery = db
      .select({ count: staff.id })
      .from(staff)
      .leftJoin(users, eq(staff.userId, users.id))
      .leftJoin(admin, eq(staff.id, admin.staffId));

    let filteredCountQuery = countQuery;
    if (needsRoleFilter) {
      if (role === "admin") {
        filteredCountQuery = countQuery.where(
          and(...whereClauses, sql`${admin.id} IS NOT NULL`),
        ) as typeof countQuery;
      } else if (role === "staff") {
        filteredCountQuery = countQuery.where(
          and(...whereClauses, sql`${admin.id} IS NULL`),
        ) as typeof countQuery;
      }
    } else if (whereClauses.length > 0) {
      filteredCountQuery = countQuery.where(
        and(...whereClauses),
      ) as typeof countQuery;
    }

    const totalResult = await filteredCountQuery;
    const total = totalResult.length;

    const data = staffListRaw.map((item) => ({
      staff: item.staff,
      users: item.users,
      isAdmin: !!item.adminId,
    }));

    return NextResponse.json(
      {
        data,
        total,
        page,
        limit,
      },
      { status: 200 },
    );
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

    // Only admins can create staff
    const user = session.user as {
      role?: string;
    };
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await request.json();

    // Validate the request body
    const result = staffCreateSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const data = result.data;

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email already exists" },
        { status: 400 },
      );
    }

    // Generate secure password
    const plainPassword = generateSecurePassword(12);
    const hashedPassword = await hashPassword(plainPassword);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        isActive: data.isActive ?? true,
        isEmailVerified: false,
      })
      .returning({ id: users.id });

    if (!newUser[0]?.id) {
      throw new Error("Failed to create user");
    }

    // Create staff record
    const newStaff = await db
      .insert(staff)
      .values({
        userId: newUser[0].id,
      })
      .returning();

    // Send welcome email
    let emailSent = false;
    let emailError = false;
    try {
      await sendWelcomeEmail(data.email, data.firstName, plainPassword);
      emailSent = true;
    } catch (error) {
      console.error(`Failed to send welcome email to ${data.email}:`, error);
      emailError = true;
    }

    return NextResponse.json(
      {
        message: "Staff member created successfully",
        data: newStaff[0],
        emailSent,
        emailError,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
