import { NextResponse } from "next/server";

import { getVolunteerSignatures } from "@/services/onboarding-documents.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");

    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer profile not found" },
        { status: 404 },
      );
    }

    const signatures = await getVolunteerSignatures(volunteerId);

    return NextResponse.json({ data: signatures });
  } catch (error) {
    return handleRouteError(error);
  }
}
