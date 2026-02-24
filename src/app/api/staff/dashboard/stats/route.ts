import { NextResponse } from "next/server";

import { getStaffDashboardStats } from "@/services/dashboard.service";
import handleError from "@/utils/handle-error";
import { requireAuth } from "@/utils/server/auth";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    new URL(request.url);

    await requireAuth("staff");

    const stats = await getStaffDashboardStats();
    return NextResponse.json({ data: stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
