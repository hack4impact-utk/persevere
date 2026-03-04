import { NextResponse } from "next/server";

import { getCommunicationById } from "@/services/communications.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";
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
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
