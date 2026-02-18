import { NextResponse } from "next/server";

import { getOpenOpportunityById } from "@/services/opportunities.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
import { validateAndParseId } from "@/utils/validate-id";

/**
 * GET /api/volunteer/opportunities/[id]
 * Fetch a single open opportunity by ID
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const parsedId = validateAndParseId(id);
    if (parsedId === null) {
      return NextResponse.json(
        { error: "Invalid opportunity ID" },
        { status: 400 },
      );
    }

    const session = await requireAuth();
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const opportunity = await getOpenOpportunityById(parsedId);
    return NextResponse.json({ data: opportunity });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
