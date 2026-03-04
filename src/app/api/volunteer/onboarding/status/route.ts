import { NextResponse } from "next/server";

import { getOnboardingStatus } from "@/services/onboarding.service";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

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
    if (error instanceof AuthError) {
      const status = error.code === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.code }, { status });
    }
    console.error(
      "[GET /api/volunteer/onboarding/status] Unhandled error:",
      error,
    );
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
