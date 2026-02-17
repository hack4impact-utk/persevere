import { NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { createStaff, listStaff } from "@/services/staff-server.service";
import { ConflictError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

const staffCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireAuth("admin");

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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAuth("admin");

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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
