import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteVolunteerType,
  updateVolunteerType,
} from "@/services/volunteer-types.service";
import { requireAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

const volunteerTypeUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const typeId = validateAndParseId(id);
    if (typeId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer type ID" },
        { status: 400 },
      );
    }

    const parsed = await parseBodyOrError(request, volunteerTypeUpdateSchema);
    if ("response" in parsed) return parsed.response;

    const updated = await updateVolunteerType(typeId, parsed.data);

    return NextResponse.json({
      message: "Volunteer type updated successfully",
      data: updated,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const typeId = validateAndParseId(id);
    if (typeId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer type ID" },
        { status: 400 },
      );
    }

    await deleteVolunteerType(typeId);

    return NextResponse.json({
      message: "Volunteer type deactivated successfully",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
