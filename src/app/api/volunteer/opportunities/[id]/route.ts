import { NextResponse } from "next/server";

import { getOpportunityByIdForVolunteer } from "@/services/opportunities.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";
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
    const session = await requireAuth();
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const parsedId = validateAndParseId(id);
    if (parsedId === null) {
      return NextResponse.json(
        { error: "Invalid opportunity ID" },
        { status: 400 },
      );
    }

    const opportunity = await getOpportunityByIdForVolunteer(parsedId);
    return NextResponse.json({ data: opportunity });
  } catch (error) {
    return handleRouteError(error);
  }
}
