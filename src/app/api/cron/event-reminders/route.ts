import { NextResponse } from "next/server";

import { sendUpcomingReminders } from "@/services/notifications.service";
import { env } from "@/utils/env";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendUpcomingReminders();

    if (result.failed > 0) {
      console.error(
        `[event-reminders] sent=${result.sent} skipped=${result.skipped} failed=${result.failed}`,
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[event-reminders] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
