import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { createStaff, listStaff } from "@/services/staff-server.service";
import handleError from "@/utils/handle-error";

const staffCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(
      searchParams.get("limit") || String(DEFAULT_PAGE_SIZE),
    );

    const result = await listStaff({
      page,
      limit,
      search: searchParams.get("search"),
      isActive: searchParams.get("isActive"),
      emailVerified: searchParams.get("emailVerified"),
      role: searchParams.get("role"),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await request.json();
    const result = staffCreateSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const { staff, emailSent, emailError } = await createStaff(result.data);

    return NextResponse.json(
      {
        message: "Staff member created successfully",
        data: staff,
        emailSent,
        emailError,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "A user with this email already exists"
    ) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
