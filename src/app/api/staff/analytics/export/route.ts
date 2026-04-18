import { NextRequest, NextResponse } from "next/server";

import type { MonthlyExportData } from "@/services/analytics.service";
import { getMonthlyExportData } from "@/services/analytics.service";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function buildCsv({ volunteerTypes, rows }: MonthlyExportData): string {
  const typeHeaders = volunteerTypes.map((t) => `Hours (${t})`);
  const headers = [
    "Month",
    "Verified Hours",
    "Unique Volunteers",
    "New Volunteers",
    "Events Held",
    "Attendance Rate",
    ...typeHeaders,
  ];

  const lines = [
    headers.map((h) => escapeCsvField(h)).join(","),
    ...rows.map((r) => {
      const typeValues = volunteerTypes.map((t) =>
        escapeCsvField(r.hoursByType[t] ?? 0),
      );
      return [
        escapeCsvField(r.month),
        escapeCsvField(r.verifiedHours),
        escapeCsvField(r.uniqueVolunteers),
        escapeCsvField(r.newVolunteers),
        escapeCsvField(r.eventsHeld),
        escapeCsvField(r.attendanceRate),
        ...typeValues,
      ].join(",");
    }),
  ];

  return lines.join("\r\n");
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await requireStaffAuth();

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    const data = await getMonthlyExportData(startDate, endDate);
    const csv = buildCsv(data);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="monthly-report.csv"',
      },
    });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
