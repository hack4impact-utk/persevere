import { NextResponse } from "next/server";

import { getOnboardingStatus } from "@/services/onboarding.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const status = await getOnboardingStatus(volunteerId);
    if (!status) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: status });
  } catch (error) {
    console.error(
      "[GET /api/volunteer/onboarding/status] Unhandled error:",
      error,
    );
    return handleRouteError(error);
  }
}
