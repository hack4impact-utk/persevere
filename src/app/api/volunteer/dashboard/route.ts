import { NextResponse } from "next/server";

import { getVolunteerDashboard } from "@/services/dashboard.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");

    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dashboard = await getVolunteerDashboard(volunteerId);
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
