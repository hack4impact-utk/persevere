import { NextResponse } from "next/server";

import { getVolunteerDashboard } from "@/services/dashboard.service";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    new URL(request.url);

    const session = await requireAuth("volunteer");

    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      throw new AuthError("Forbidden");
    }

    const dashboard = await getVolunteerDashboard(volunteerId);
    return NextResponse.json({ data: dashboard }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
