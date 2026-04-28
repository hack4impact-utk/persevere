import { NextResponse } from "next/server";

import { listEventCategories } from "@/services/opportunities.service";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";

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
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
