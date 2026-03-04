import { NextResponse } from "next/server";

import { getStaffDashboardStats } from "@/services/dashboard.service";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";

export async function GET(): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const stats = await getStaffDashboardStats();
    return NextResponse.json({ data: stats }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
