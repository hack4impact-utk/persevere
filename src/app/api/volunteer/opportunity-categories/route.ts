import { NextResponse } from "next/server";

import { listEventCategories } from "@/services/opportunities.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

/**
 * GET /api/volunteer/opportunity-categories
 * Returns all event categories for use in the browse filter dropdown.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await listEventCategories();
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
