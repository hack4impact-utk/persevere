import { NextResponse } from "next/server";
import { z } from "zod";

import {
  listRsvpsByStatus,
  updateRsvpStatus,
} from "@/services/event-rsvps.service";
import { NotFoundError, ValidationError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";

const updateRsvpSchema = z.object({
  volunteerId: z.number().int().positive(),
  opportunityId: z.number().int().positive(),
  status: z.enum(["confirmed", "declined", "attended", "no_show", "cancelled"]),
});

/**
 * GET /api/staff/rsvps
 * List RSVPs filtered by status (default: pending).
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") ?? "pending";
    const statusSchema = z.enum([
      "pending",
      "confirmed",
      "declined",
      "attended",
      "no_show",
    ]);
    const parsed = statusSchema.safeParse(statusParam);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status filter" },
        { status: 400 },
      );
    }

    const data = await listRsvpsByStatus(parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

/**
 * PUT /api/staff/rsvps
 * Update an RSVP status (confirm, decline, mark attended, no_show).
 */
export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await parseBodyOrError(request, updateRsvpSchema);
    if ("response" in parsed) return parsed.response;

    const { volunteerId, opportunityId, status } = parsed.data;
    await updateRsvpStatus(volunteerId, opportunityId, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
