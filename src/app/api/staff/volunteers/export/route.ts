import { NextResponse } from "next/server";

import { getVolunteerExportData } from "@/services/volunteer-export.service";
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

export async function GET(): Promise<Response> {
  try {
    await requireStaffAuth();

    const { docs, rows } = await getVolunteerExportData();

    const paperworkHeaders = docs.map((d) =>
      escapeCsvField(`Paperwork: ${d.title}`),
    );
    const headers = [
      "First",
      "Last",
      "Email",
      "Phone",
      "Employer",
      "Job Title",
      ...paperworkHeaders,
      "City/State",
      "Hours (Verified)",
      "Events Attended",
      "How Did They Hear About Us?",
    ];

    const lines = [
      headers.join(","),
      ...rows.map((r) => {
        const paperworkValues = docs.map((d) =>
          escapeCsvField(r.paperwork[d.id] ?? ""),
        );
        return [
          escapeCsvField(r.firstName),
          escapeCsvField(r.lastName),
          escapeCsvField(r.email),
          escapeCsvField(r.phone),
          escapeCsvField(r.employer),
          escapeCsvField(r.jobTitle),
          ...paperworkValues,
          escapeCsvField(r.cityState),
          escapeCsvField(r.verifiedHours),
          escapeCsvField(r.eventsAttended),
          escapeCsvField(r.referralSource),
        ].join(",");
      }),
    ];

    return new Response(lines.join("\r\n"), {
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
