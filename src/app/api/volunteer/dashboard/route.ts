import { NextResponse } from "next/server";

import { getVolunteerDashboard } from "@/services/dashboard.service";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";

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
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
