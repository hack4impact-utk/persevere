import { NextResponse } from "next/server";

import { listInterests } from "@/services/interests-server.service";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";

export async function GET(): Promise<NextResponse> {
  try {
    await requireAuth("volunteer");

    const interests = await listInterests();

    return NextResponse.json({ data: interests });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
