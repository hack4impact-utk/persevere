import { NextResponse } from "next/server";

import { getVolunteerSignatures } from "@/services/onboarding-documents.service";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";

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
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
