import { NextResponse } from "next/server";

import {
  deactivateStaff,
  getStaffById,
  updateStaff,
} from "@/services/staff-server.service";
import { requireAuth } from "@/utils/server/auth";
import { handleRouteError } from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireAuth("admin");

    const { id } = await params;
    const staffId = validateAndParseId(id);
    if (staffId === null) {
      return NextResponse.json({ error: "Invalid staff ID" }, { status: 400 });
    }

    const data = await getStaffById(staffId);

    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireAuth("admin");

    const { id } = await params;
    const staffId = validateAndParseId(id);
    if (staffId === null) {
      return NextResponse.json({ error: "Invalid staff ID" }, { status: 400 });
    }

    const json = await request.json();
    await updateStaff(staffId, json);

    return NextResponse.json({ message: "Staff member updated successfully" });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireAuth("admin");

    const { id } = await params;
    const staffId = validateAndParseId(id);
    if (staffId === null) {
      return NextResponse.json({ error: "Invalid staff ID" }, { status: 400 });
    }

    await deactivateStaff(staffId);

    return NextResponse.json({
      message: "Staff member deactivated successfully",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
