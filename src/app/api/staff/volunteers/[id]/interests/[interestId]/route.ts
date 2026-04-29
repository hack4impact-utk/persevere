import { NextResponse } from "next/server";

import { removeInterest } from "@/services/volunteer-interests.service";
import { requireStaffAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; interestId: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id, interestId: interestIdParam } = await params;
    const volunteerId = validateAndParseId(id);
    const interestId = validateAndParseId(interestIdParam);

    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    if (interestId === null) {
      return NextResponse.json(
        { error: "Invalid interest ID" },
        { status: 400 },
      );
    }

    await removeInterest(volunteerId, interestId);

    return NextResponse.json({
      message: "Interest removed from volunteer successfully",
      data: { volunteerId, interestId },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
