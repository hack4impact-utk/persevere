import { NextResponse } from "next/server";

import {
  listVolunteerHours,
  logHours,
} from "@/services/volunteer-hours.service";
import { NotFoundError } from "@/utils/errors";
import { AuthError, requireAuth } from "@/utils/server/auth";
import { validateAndParseId } from "@/utils/validate-id";

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
    return NextResponse.json(
      { error: "Failed to fetch hours" },
      { status: 500 },
    );
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
    const { opportunityId, date, hours, notes } = body;

    if (!opportunityId || !date || typeof hours !== "number" || hours <= 0) {
      return NextResponse.json(
        {
          error: "Valid opportunityId, date, and positive hours are required.",
        },
        { status: 400 },
      );
    }

    const entry = await logHours({
      volunteerId,
      opportunityId,
      date,
      hours,
      notes,
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
    return NextResponse.json({ error: "Failed to log hours" }, { status: 500 });
  }
}
