import { NextResponse } from "next/server";

import {
  createDocument,
  createDocumentSchema,
  listDocuments,
} from "@/services/onboarding-documents.service";
import { ConflictError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const docs = await listDocuments();

    return NextResponse.json({ data: docs });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const parsed = await parseBodyOrError(request, createDocumentSchema);
    if ("response" in parsed) return parsed.response;

    const doc = await createDocument(parsed.data);

    return NextResponse.json(
      { message: "Document created successfully", data: doc },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
