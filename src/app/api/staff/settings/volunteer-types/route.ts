import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createVolunteerType,
  listAllVolunteerTypes,
} from "@/services/volunteer-types.service";
import { requireAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";

const volunteerTypeCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const types = await listAllVolunteerTypes();

    return NextResponse.json({ data: types });
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

    const parsed = await parseBodyOrError(request, volunteerTypeCreateSchema);
    if ("response" in parsed) return parsed.response;

    const newType = await createVolunteerType(parsed.data);

    return NextResponse.json(
      { message: "Volunteer type created successfully", data: newType },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
