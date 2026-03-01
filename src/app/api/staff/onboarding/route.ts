import { NextResponse } from "next/server";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { listVolunteerOnboarding } from "@/services/onboarding.service";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    console.error("[GET /api/staff/onboarding] Unhandled error:", error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
