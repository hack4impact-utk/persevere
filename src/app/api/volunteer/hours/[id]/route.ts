import { NextResponse } from "next/server";
import { z } from "zod";

import {
  volunteerDeleteHours,
  volunteerEditHoursRequest,
} from "@/services/volunteer-hours.service";
import { requireAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

const editHoursSchema = z.object({
  hours: z.number().positive().max(24).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "volunteer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const hoursId = validateAndParseId(id);
    if (hoursId === null) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }
    const parsed = await parseBodyOrError(request, editHoursSchema);
    if ("response" in parsed) return parsed.response;
    const updated = await volunteerEditHoursRequest(
      hoursId,
      volunteerId,
      parsed.data,
    );
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");
    const { id } = await params;
    const hoursId = validateAndParseId(id);
    if (hoursId === null) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const volunteerId = session.user.volunteerId;
    if (!volunteerId) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }
    await volunteerDeleteHours(hoursId, volunteerId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
