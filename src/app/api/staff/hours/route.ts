import { NextResponse } from "next/server";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { listAllVolunteerHours } from "@/services/volunteer-hours.service";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(
      searchParams.get("limit") || String(DEFAULT_PAGE_SIZE),
    );
    const status = searchParams.get("status") as
      | "pending"
      | "verified"
      | "all"
      | null;
    const search = searchParams.get("search");

    const { data, total } = await listAllVolunteerHours({
      page,
      limit,
      status: status || undefined,
      search: search || undefined,
    });

    return NextResponse.json({ data, total });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
