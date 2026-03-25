import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getStaffProfile,
  updateStaffProfile,
} from "@/services/staff-server.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";

const updateProfileSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    phone: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
  })
  .strict();

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireStaffAuth();
    const userId = Number.parseInt(session.user.id, 10);
    const profile = await getStaffProfile(userId);
    return NextResponse.json({ data: profile }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await requireStaffAuth();
    const userId = Number.parseInt(session.user.id, 10);

    const parsed = await parseBodyOrError(request, updateProfileSchema);
    if ("response" in parsed) return parsed.response;

    const profile = await updateStaffProfile(userId, parsed.data);
    return NextResponse.json({ data: profile }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
