import { NextResponse } from "next/server";

import { listSkills } from "@/services/skills-server.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    await requireAuth("volunteer");

    const skills = await listSkills();

    return NextResponse.json({ data: skills });
  } catch (error) {
    return handleRouteError(error);
  }
}
