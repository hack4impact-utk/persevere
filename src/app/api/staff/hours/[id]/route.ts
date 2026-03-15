import { NextResponse } from "next/server";
import { z } from "zod";

import {
  approveHours,
  deleteHours,
  rejectHours,
} from "@/services/volunteer-hours.service";
import { ConflictError, NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

const updateHoursSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().optional() }),
]);

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireStaffAuth();

    const { id } = await params;
    const hourId = validateAndParseId(id);
    if (hourId === null) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const parsed = await parseBodyOrError(req, updateHoursSchema);
    if ("response" in parsed) return parsed.response;

    const staffId = Number.parseInt(session.user.id, 10);

    if (parsed.data.action === "approve") {
      const result = await approveHours(hourId, staffId);
      return NextResponse.json({ data: result });
    } else {
      const result = await rejectHours(hourId, staffId, parsed.data.reason);
      return NextResponse.json({ data: result });
    }
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const { id } = await params;
    const hourId = validateAndParseId(id);
    if (hourId === null) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    await deleteHours(hourId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
