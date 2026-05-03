import { NextResponse } from "next/server";

import {
  createDocument,
  createDocumentSchema,
  listDocuments,
} from "@/services/onboarding-documents.service";
import { requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const docs = await listDocuments();

    return NextResponse.json({ data: docs });
  } catch (error) {
    return handleRouteError(error);
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
    return handleRouteError(error);
  }
}
