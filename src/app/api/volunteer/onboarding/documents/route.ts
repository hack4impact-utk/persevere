import { NextResponse } from "next/server";

import { listDocuments } from "@/services/onboarding-documents.service";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";

export async function GET(): Promise<NextResponse> {
  try {
    await requireAuth("volunteer");

    const docs = await listDocuments();

    return NextResponse.json({ data: docs });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
