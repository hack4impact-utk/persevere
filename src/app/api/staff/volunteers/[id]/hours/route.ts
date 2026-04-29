import { NextResponse } from "next/server";

import { listVolunteerHours } from "@/services/volunteer-hours.service";
import { requireStaffAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const result = await listVolunteerHours({
      volunteerId,
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      verified: searchParams.get("verified"),
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
