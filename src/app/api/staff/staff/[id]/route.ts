import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import db from "@/db";
import { staff, users } from "@/db/schema";
import handleError from "@/utils/handle-error";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can access staff details
    const user = session.user as {
      role?: string;
    };
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staffId = Number.parseInt(params.id);
    if (Number.isNaN(staffId)) {
      return NextResponse.json({ error: "Invalid staff ID" }, { status: 400 });
    }

    const staffMember = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
      with: {
        user: true,
        admin: true,
      },
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        data: {
          staff: {
            id: staffMember.id,
            userId: staffMember.userId,
            notificationPreference: staffMember.notificationPreference,
            createdAt: staffMember.createdAt,
            updatedAt: staffMember.updatedAt,
          },
          users: staffMember.user,
          isAdmin: !!staffMember.admin,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can update staff
    const user = session.user as {
      role?: string;
    };
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staffId = Number.parseInt(params.id);
    if (Number.isNaN(staffId)) {
      return NextResponse.json({ error: "Invalid staff ID" }, { status: 400 });
    }

    const json = await request.json();

    // Find staff member
    const staffMember = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 },
      );
    }

    // Update user fields if provided
    if (
      json.firstName ||
      json.lastName ||
      json.email ||
      json.phone !== undefined ||
      json.isActive !== undefined
    ) {
      await db
        .update(users)
        .set({
          firstName: json.firstName,
          lastName: json.lastName,
          email: json.email,
          phone: json.phone,
          isActive: json.isActive,
        })
        .where(eq(users.id, staffMember.userId));
    }

    // Update staff fields if provided
    if (json.notificationPreference) {
      await db
        .update(staff)
        .set({
          notificationPreference: json.notificationPreference,
        })
        .where(eq(staff.id, staffId));
    }

    return NextResponse.json(
      { message: "Staff member updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can deactivate staff
    const user = session.user as {
      role?: string;
    };
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staffId = Number.parseInt(params.id);
    if (Number.isNaN(staffId)) {
      return NextResponse.json({ error: "Invalid staff ID" }, { status: 400 });
    }

    // Find staff member
    const staffMember = await db.query.staff.findFirst({
      where: eq(staff.id, staffId),
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 },
      );
    }

    // Deactivate user instead of deleting (soft delete)
    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, staffMember.userId));

    return NextResponse.json(
      { message: "Staff member deactivated successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
