import { NextResponse } from "next/server";

import {
  deleteDocument,
  updateDocument,
  updateDocumentSchema,
} from "@/services/onboarding-documents.service";
import { requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const docId = validateAndParseId(id);
    if (docId === null) {
      return NextResponse.json(
        { error: "Invalid document ID" },
        { status: 400 },
      );
    }

    const parsed = await parseBodyOrError(request, updateDocumentSchema);
    if ("response" in parsed) return parsed.response;

    const updated = await updateDocument(docId, parsed.data);

    return NextResponse.json({
      message: "Document updated successfully",
      data: updated,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const docId = validateAndParseId(id);
    if (docId === null) {
      return NextResponse.json(
        { error: "Invalid document ID" },
        { status: 400 },
      );
    }

    await deleteDocument(docId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
