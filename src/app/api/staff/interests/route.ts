import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createInterest,
  listInterests,
} from "@/services/interests-server.service";
import { requireAuth, requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";

const interestCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const allInterests = await listInterests();

    return NextResponse.json({ data: allInterests });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await parseBodyOrError(request, interestCreateSchema);
    if ("response" in parsed) return parsed.response;

    const newInterest = await createInterest(parsed.data);

    return NextResponse.json(
      { message: "Interest created successfully", data: newInterest },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
