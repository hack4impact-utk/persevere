import { NextResponse } from "next/server";
import { z } from "zod";

import { rsvpStatusSchema } from "@/lib/status-enums";
import {
  listRsvpsByStatus,
  updateRsvpStatus,
} from "@/services/event-rsvps.service";
import { requireAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";

const updateRsvpSchema = z.object({
  volunteerId: z.number().int().positive(),
  opportunityId: z.number().int().positive(),
  status: rsvpStatusSchema.exclude(["pending"]),
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
    const parsed = rsvpStatusSchema.safeParse(statusParam);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status filter" },
        { status: 400 },
      );
    }

    const data = await listRsvpsByStatus(parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
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
    return handleRouteError(error);
  }
}
