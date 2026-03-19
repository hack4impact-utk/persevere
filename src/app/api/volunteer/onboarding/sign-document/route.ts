import { NextResponse } from "next/server";

import {
  signDocument,
  signDocumentSchema,
} from "@/services/onboarding-documents.service";
import { ConflictError, NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");

    const parsed = await parseBodyOrError(request, signDocumentSchema);
    if ("response" in parsed) return parsed.response;

    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer record not found" },
        { status: 400 },
      );
    }

    const signature = await signDocument(volunteerId, parsed.data.documentId);

    return NextResponse.json(
      { message: "Document signed successfully", data: signature },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
