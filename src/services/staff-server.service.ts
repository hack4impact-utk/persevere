import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import db from "@/db";
import { admin, staff, users } from "@/db/schema";
import { sendWelcomeEmail } from "@/utils/server/email";
import { generateSecurePassword, hashPassword } from "@/utils/server/password";

export type StaffListFilters = {
  page: number;
  limit: number;
  search?: string | null;
  isActive?: string | null;
  emailVerified?: string | null;
  role?: string | null;
};

export type CreateStaffInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive?: boolean;
};

/**
 * Lists staff members with optional filtering and pagination.
 */
export async function listStaff(filters: StaffListFilters): Promise<{
  data: {
    staff: {
      id: number;
      userId: number;
      notificationPreference: string;
      createdAt: Date;
      updatedAt: Date;
    };
    users: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      isActive: boolean;
      isEmailVerified: boolean;
      profilePicture: string | null;
      createdAt: Date;
    } | null;
    isAdmin: boolean;
  }[];
  total: number;
  page: number;
  limit: number;
}> {
  const { page, limit, search, isActive, emailVerified, role } = filters;
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
  if (isActive !== null && isActive !== undefined) {
    whereClauses.push(eq(users.isActive, isActive === "true"));
  }
  if (emailVerified !== null && emailVerified !== undefined) {
    whereClauses.push(eq(users.isEmailVerified, emailVerified === "true"));
  }

  const needsRoleFilter = role === "admin" || role === "staff";

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

  let filteredQuery = baseQuery;
  if (needsRoleFilter) {
    filteredQuery =
      role === "admin"
        ? (baseQuery.where(
            and(...whereClauses, sql`${admin.id} IS NOT NULL`),
          ) as typeof baseQuery)
        : (baseQuery.where(
            and(...whereClauses, sql`${admin.id} IS NULL`),
          ) as typeof baseQuery);
  } else if (whereClauses.length > 0) {
    filteredQuery = baseQuery.where(and(...whereClauses)) as typeof baseQuery;
  }

  const staffListRaw = await filteredQuery.limit(limit).offset(offset);

  const countQuery = db
    .select({ count: staff.id })
    .from(staff)
    .leftJoin(users, eq(staff.userId, users.id))
    .leftJoin(admin, eq(staff.id, admin.staffId));

  let filteredCountQuery = countQuery;
  if (needsRoleFilter) {
    filteredCountQuery =
      role === "admin"
        ? (countQuery.where(
            and(...whereClauses, sql`${admin.id} IS NOT NULL`),
          ) as typeof countQuery)
        : (countQuery.where(
            and(...whereClauses, sql`${admin.id} IS NULL`),
          ) as typeof countQuery);
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

  return { data, total, page, limit };
}

/**
 * Creates a new staff user, sends a welcome email, and returns the result.
 */
export async function createStaff(input: CreateStaffInput): Promise<{
  staff: typeof import("@/db/schema").staff.$inferSelect | undefined;
  emailSent: boolean;
  emailError: boolean;
}> {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const plainPassword = generateSecurePassword(12);
  const hashedPassword = await hashPassword(plainPassword);

  const newUser = await db
    .insert(users)
    .values({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      password: hashedPassword,
      isActive: input.isActive ?? true,
      isEmailVerified: false,
    })
    .returning({ id: users.id });

  if (!newUser[0]?.id) {
    throw new Error("Failed to create user");
  }

  const newStaff = await db
    .insert(staff)
    .values({ userId: newUser[0].id })
    .returning();

  let emailSent = false;
  let emailError = false;
  try {
    await sendWelcomeEmail(input.email, input.firstName, plainPassword);
    emailSent = true;
  } catch (error) {
    console.error(`Failed to send welcome email to ${input.email}:`, error);
    emailError = true;
  }

  return { staff: newStaff[0], emailSent, emailError };
}
