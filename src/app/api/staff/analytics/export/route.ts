import { NextRequest, NextResponse } from "next/server";

import type { ExportRow } from "@/services/analytics.service";
import { getExportData } from "@/services/analytics.service";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";

function escapeCsvField(value: string | number): string {
  const str = String(value);
  // Wrap in quotes if value contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: ExportRow[]): string {
  const headers = [
    "Name",
    "Total Hours",
    "Verified Hours",
    "Events Attended",
    "Volunteer Type",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        escapeCsvField(r.name),
        escapeCsvField(r.totalHours),
        escapeCsvField(r.verifiedHours),
        escapeCsvField(r.eventsAttended),
        escapeCsvField(r.volunteerType),
      ].join(","),
    ),
  ];

  return lines.join("\r\n");
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await requireStaffAuth();

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    const rows = await getExportData(startDate, endDate);
    const csv = rowsToCsv(rows);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="volunteers.csv"',
      },
    });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
