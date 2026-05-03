import { NextResponse } from "next/server";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { listVolunteerOnboarding } from "@/services/onboarding.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(
      searchParams.get("limit") || String(DEFAULT_PAGE_SIZE),
    );
    const search = searchParams.get("search");

    const { data, total } = await listVolunteerOnboarding({
      page,
      limit,
      search,
    });

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error("[GET /api/staff/onboarding] Unhandled error:", error);
    return handleRouteError(error);
  }
}
