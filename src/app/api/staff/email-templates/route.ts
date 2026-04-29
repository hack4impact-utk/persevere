import { NextResponse } from "next/server";

import { listActiveTemplates } from "@/services/email-templates.service";
import { requireStaffAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const templates = await listActiveTemplates();

    return NextResponse.json({ data: templates });
  } catch (error) {
    return handleRouteError(error);
  }
}
