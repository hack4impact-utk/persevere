import { NextResponse } from "next/server";

import { listSkills } from "@/services/skills-server.service";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";

export async function GET(): Promise<NextResponse> {
  try {
    await requireAuth("volunteer");

    const skills = await listSkills();

    return NextResponse.json({ data: skills });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
