import { NextResponse } from "next/server";

import { autoCompleteExpiredEvents } from "@/services/calendar-events.service";
import { env } from "@/utils/env";
import handleError from "@/utils/handle-error";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await autoCompleteExpiredEvents();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[close-expired-events] Unexpected error:", error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
