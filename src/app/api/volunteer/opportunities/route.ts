import { NextResponse } from "next/server";

import { listOpenOpportunities } from "@/services/opportunities.service";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

/**
 * GET /api/volunteer/opportunities
 * List open opportunities that are not full
 * Query params: limit, offset, search
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    // Only volunteers can browse opportunities
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") || "20", 10), 1),
      100,
    );
    const offset = Math.max(
      Number.parseInt(searchParams.get("offset") || "0", 10),
      0,
    );
    const search = searchParams.get("search")?.trim() || "";

    const opportunitiesWithSpots = await listOpenOpportunities({
      limit,
      offset,
      search,
    });

    return NextResponse.json({ data: opportunitiesWithSpots });
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.code }, { status });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
