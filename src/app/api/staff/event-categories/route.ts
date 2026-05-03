import { NextResponse } from "next/server";

import { listActiveEventCategories } from "@/services/event-categories.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await listActiveEventCategories();

    return NextResponse.json({ data: categories });
  } catch (error) {
    return handleRouteError(error);
  }
}
