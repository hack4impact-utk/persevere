import { NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { createStaff, listStaff } from "@/services/staff-server.service";
import { ConflictError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";

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
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAuth("admin");

    const parsed = await parseBodyOrError(request, staffCreateSchema);
    if ("response" in parsed) return parsed.response;

    const { staff, emailSent, emailError } = await createStaff(parsed.data);

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
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
