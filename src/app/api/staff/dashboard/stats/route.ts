import { NextResponse } from "next/server";

import { getStaffDashboardStats } from "@/services/dashboard.service";
import { requireStaffAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const stats = await getStaffDashboardStats();
    return NextResponse.json({ data: stats }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
