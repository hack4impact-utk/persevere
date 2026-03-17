import { NextResponse } from "next/server";

import {
  DEFAULT_PAGE_SIZE,
  RECOMMENDED_OPPORTUNITIES_LIMIT,
} from "@/lib/constants";
import { listOpenOpportunities } from "@/services/opportunities.service";
import { getRecommendedOpportunities } from "@/services/recommendation.service";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";

/**
 * GET /api/volunteer/opportunities
 * List open opportunities that are not full
 * Query params: limit, offset, search
 * Query param: recommended=true → returns personalized recommendations for the volunteer
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();

    // Only volunteers can browse opportunities
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    if (searchParams.get("recommended") === "true") {
      const volunteerId = session.user.volunteerId;
      if (!volunteerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const data = await getRecommendedOpportunities(
        volunteerId,
        RECOMMENDED_OPPORTUNITIES_LIMIT,
      );
      return NextResponse.json({ data });
    }
    const limit = Math.min(
      Math.max(
        Number.parseInt(
          searchParams.get("limit") || String(DEFAULT_PAGE_SIZE),
          10,
        ),
        1,
      ),
      100,
    );
    const offset = Math.max(
      Number.parseInt(searchParams.get("offset") || "0", 10),
      0,
    );
    const search = searchParams.get("search")?.trim() || "";

    const { data, total } = await listOpenOpportunities({
      limit,
      offset,
      search,
    });

    return NextResponse.json({ data, total });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
