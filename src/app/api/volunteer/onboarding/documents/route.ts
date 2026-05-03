import { NextResponse } from "next/server";

import { listDocuments } from "@/services/onboarding-documents.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    await requireAuth("volunteer");

    const docs = await listDocuments();

    return NextResponse.json({ data: docs });
  } catch (error) {
    return handleRouteError(error);
  }
}
