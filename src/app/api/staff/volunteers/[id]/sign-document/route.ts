import { NextResponse } from "next/server";

import {
  signDocument,
  signDocumentSchema,
} from "@/services/onboarding-documents.service";
import { requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

export async function POST(
  request: Request,
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

    const parsed = await parseBodyOrError(request, signDocumentSchema);
    if ("response" in parsed) return parsed.response;

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
