import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteInterest,
  getInterestById,
  updateInterest,
} from "@/services/interests-server.service";
import { requireAuth, requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

const interestUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const interestId = validateAndParseId(id);
    if (interestId === null) {
      return NextResponse.json(
        { error: "Invalid interest ID" },
        { status: 400 },
      );
    }

    const interest = await getInterestById(interestId);

    return NextResponse.json({ data: interest });
  } catch (error) {
    return handleRouteError(error);
  }
}

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
    const interestId = validateAndParseId(id);
    if (interestId === null) {
      return NextResponse.json(
        { error: "Invalid interest ID" },
        { status: 400 },
      );
    }

    const parsed = await parseBodyOrError(request, interestUpdateSchema);
    if ("response" in parsed) return parsed.response;

    const updatedInterest = await updateInterest(interestId, parsed.data);

    return NextResponse.json({
      message: "Interest updated successfully",
      data: updatedInterest,
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
    const interestId = validateAndParseId(id);
    if (interestId === null) {
      return NextResponse.json(
        { error: "Invalid interest ID" },
        { status: 400 },
      );
    }

    await deleteInterest(interestId);

    return NextResponse.json({ message: "Interest deleted successfully" });
  } catch (error) {
    return handleRouteError(error);
  }
}
