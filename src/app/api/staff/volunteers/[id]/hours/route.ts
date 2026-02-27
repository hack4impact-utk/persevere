import { NextResponse } from "next/server";
import { z } from "zod";

import {
  listVolunteerHours,
  logHours,
} from "@/services/volunteer-hours.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

const logHoursSchema = z.object({
  opportunityId: z.number().int().positive(),
  date: z.string().min(1, "Date is required"),
  hours: z.number().positive("Hours must be positive"),
  notes: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const result = await listVolunteerHours({
      volunteerId,
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      verified: searchParams.get("verified"),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("GET Hours Error:", error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const parsed = await parseBodyOrError(req, logHoursSchema);
    if ("response" in parsed) return parsed.response;

    const entry = await logHours({
      volunteerId,
      opportunityId: parsed.data.opportunityId,
      date: parsed.data.date,
      hours: parsed.data.hours,
      notes: parsed.data.notes,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("POST Hours Error:", error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
