import { NextResponse } from "next/server";
import { z } from "zod";

import {
  assignInterest,
  getVolunteerInterests,
} from "@/services/volunteer-interests.service";
import { requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

const addInterestSchema = z.object({
  interestId: z
    .number()
    .int()
    .positive("Interest ID must be a positive integer"),
});

export async function GET(
  _request: Request,
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

    const data = await getVolunteerInterests(volunteerId);

    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
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

    const parsed = await parseBodyOrError(request, addInterestSchema);
    if ("response" in parsed) return parsed.response;
    const { interestId } = parsed.data;
    await assignInterest(volunteerId, interestId);

    return NextResponse.json(
      {
        message: "Interest assigned successfully",
        data: { volunteerId, interestId },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
