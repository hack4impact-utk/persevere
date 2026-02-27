import { NextResponse } from "next/server";
import { z } from "zod";

import {
  listVolunteerHours,
  logHours,
} from "@/services/volunteer-hours.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
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
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    console.error("GET Hours Error:", error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const volunteerId = validateAndParseId(id);
    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const result = logHoursSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const entry = await logHours({
      volunteerId,
      opportunityId: result.data.opportunityId,
      date: result.data.date,
      hours: result.data.hours,
      notes: result.data.notes,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("POST Hours Error:", error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
