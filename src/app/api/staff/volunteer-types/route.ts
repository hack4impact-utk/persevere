import { NextResponse } from "next/server";

import { listActiveVolunteerTypes } from "@/services/volunteer-types.service";
import { requireStaffAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const types = await listActiveVolunteerTypes();

    return NextResponse.json({ data: types });
  } catch (error) {
    return handleRouteError(error);
  }
}
