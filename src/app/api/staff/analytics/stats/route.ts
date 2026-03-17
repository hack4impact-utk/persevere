import { NextRequest, NextResponse } from "next/server";

import { getAnalyticsStats } from "@/services/analytics.service";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    const stats = await getAnalyticsStats(startDate, endDate);
    return NextResponse.json({ data: stats }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
