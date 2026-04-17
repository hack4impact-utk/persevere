import { NextResponse } from "next/server";
import Papa from "papaparse";

import {
  type ImportRow,
  importVolunteers,
} from "@/services/volunteer-import.service";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";

const REQUIRED_HEADERS = ["First", "Last", "Email"];

function parseCityState(raw: string): { city?: string; state?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const lastComma = trimmed.lastIndexOf(",");
  if (lastComma === -1) return { city: trimmed };
  return {
    city: trimmed.slice(0, lastComma).trim(),
    state: trimmed.slice(lastComma + 1).trim(),
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireStaffAuth();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    const headers = parsed.meta.fields ?? [];
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    const rows: ImportRow[] = parsed.data.map((row) => {
      const { city, state } = parseCityState(row["City/State"] ?? "");
      return {
        firstName: (row["First"] ?? "").trim(),
        lastName: (row["Last"] ?? "").trim(),
        email: (row["Email"] ?? "").trim(),
        phone: (row["Phone"] ?? "").trim() || undefined,
        employer: (row["Employer"] ?? "").trim() || undefined,
        jobTitle: (row["Job Title"] ?? "").trim() || undefined,
        city,
        state,
        referralSource:
          (row["How did they hear about us?"] ?? "").trim() || undefined,
      };
    });

    const result = await importVolunteers(rows);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
