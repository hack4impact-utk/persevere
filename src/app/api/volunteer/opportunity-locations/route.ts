import { NextResponse } from "next/server";

import { listOpportunityLocations } from "@/services/opportunities.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

/**
 * GET /api/volunteer/opportunity-locations
 * Returns distinct locations from open future opportunities for the filter dropdown.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await listOpportunityLocations();
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
