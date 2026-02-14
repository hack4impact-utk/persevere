import { NextResponse } from "next/server";

import { listOpenOpportunities } from "@/services/opportunities.service";
import { requireAuth } from "@/utils/auth";
import handleError from "@/utils/handle-error";

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
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
