import { NextResponse } from "next/server";

import {
  signDocument,
  signDocumentSchema,
} from "@/services/onboarding-documents.service";
import { requireAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";

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

    const signature = await signDocument(
      volunteerId,
      parsed.data.documentId,
      parsed.data.consentGiven,
    );

    return NextResponse.json(
      { message: "Document signed successfully", data: signature },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
