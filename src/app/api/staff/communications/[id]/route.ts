import { NextResponse } from "next/server";

import {
  deleteCommunication,
  getCommunicationById,
} from "@/services/communications.service";
import { requireStaffAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const communicationId = validateAndParseId(id);

    if (communicationId === null) {
      return NextResponse.json(
        { error: "Invalid communication ID" },
        { status: 400 },
      );
    }

    const communication = await getCommunicationById(communicationId);

    return NextResponse.json({ communication });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();
    const { id } = await params;
    const parsedId = validateAndParseId(id);
    if (!parsedId)
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    await deleteCommunication(parsedId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
