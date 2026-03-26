import { NextResponse } from "next/server";

import { listVolunteerAnnouncements } from "@/services/communications.service";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";

/**
 * GET /api/volunteer/announcements
 * Returns all staff announcements sent to volunteers, ordered newest-first.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await listVolunteerAnnouncements();
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
