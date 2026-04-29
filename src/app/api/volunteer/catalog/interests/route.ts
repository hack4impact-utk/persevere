import { NextResponse } from "next/server";

import { listInterests } from "@/services/interests-server.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    await requireAuth("volunteer");

    const interests = await listInterests();

    return NextResponse.json({ data: interests });
  } catch (error) {
    return handleRouteError(error);
  }
}
