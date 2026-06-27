import { NextResponse } from "next/server";
import { z } from "zod";

import { hoursStatusSchema } from "@/lib/status-enums";
import { listAllHours, logHours } from "@/services/volunteer-hours.service";
import { requireAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";

const logHoursSchema = z.object({
  volunteerId: z.number().int().positive(),
  opportunityId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .default(null),
  date: z.string().min(1, "Date is required"),
  hours: z.number().positive().max(24),
  notes: z.string().optional(),
});

/**
 * GET /api/staff/hours
 * List all volunteer hours records, optionally filtered by status.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const parsed = hoursStatusSchema
      .optional()
      .safeParse(statusParam ?? undefined);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status filter" },
        { status: 400 },
      );
    }

    const data = await listAllHours(parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/staff/hours
 * Log hours for a volunteer (staff action).
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await parseBodyOrError(request, logHoursSchema);
    if ("response" in parsed) return parsed.response;

    const result = await logHours(parsed.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
