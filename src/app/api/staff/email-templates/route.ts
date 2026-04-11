import { NextResponse } from "next/server";

import { listActiveTemplates } from "@/services/email-templates.service";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";

export async function GET(): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const templates = await listActiveTemplates();

    return NextResponse.json({ data: templates });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
