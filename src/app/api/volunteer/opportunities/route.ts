import { NextResponse } from "next/server";

import {
  DEFAULT_PAGE_SIZE,
  RECOMMENDED_OPPORTUNITIES_LIMIT,
} from "@/lib/constants";
import { listOpenOpportunities } from "@/services/opportunities.service";
import { getRecommendedOpportunities } from "@/services/recommendation.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

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
    const rawCategoryId = searchParams.get("categoryId");
    const categoryId = rawCategoryId
      ? Number.parseInt(rawCategoryId, 10)
      : undefined;
    const locationFilter = searchParams.get("locationFilter")?.trim() || "";
    const rawDateRange = searchParams.get("dateRange");
    const dateRange =
      rawDateRange === "week" || rawDateRange === "month"
        ? rawDateRange
        : undefined;

    const { data, total } = await listOpenOpportunities({
      limit,
      offset,
      search,
      ...(categoryId && { categoryId }),
      ...(locationFilter && { locationFilter }),
      ...(dateRange && { dateRange }),
    });

    return NextResponse.json({ data, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
