import { NextResponse } from "next/server";
import { z } from "zod";

import {
  listVolunteerOwnHours,
  volunteerLogHours,
} from "@/services/volunteer-hours.service";
import { ValidationError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";

const logHoursSchema = z.object({
  opportunityId: z.number().int().positive(),
  date: z.string().min(1),
  hours: z.number().positive().max(24),
  notes: z.string().optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");
    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }
    const data = await listVolunteerOwnHours(volunteerId);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");
    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }
    const parsed = await parseBodyOrError(request, logHoursSchema);
    if ("response" in parsed) return parsed.response;
    const data = await volunteerLogHours(volunteerId, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
