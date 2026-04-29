import { NextResponse } from "next/server";

import { listVolunteerAnnouncements } from "@/services/communications.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

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
    return handleRouteError(error);
  }
}
