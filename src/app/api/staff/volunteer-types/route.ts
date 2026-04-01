import { NextResponse } from "next/server";

import { listActiveVolunteerTypes } from "@/services/volunteer-types.service";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";

export async function GET(): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const types = await listActiveVolunteerTypes();

    return NextResponse.json({ data: types });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
