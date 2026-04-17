import { eq } from "drizzle-orm";
import validator from "validator";

import db from "@/db";
import { users } from "@/db/schema";

import { createVolunteer } from "./volunteer.service";

export type ImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employer?: string;
  jobTitle?: string;
  city?: string;
  state?: string;
  referralSource?: string;
};

export type ImportResult = {
  created: number;
  skipped: number;
  errors: { row: number; email: string; reason: string }[];
};

export async function importVolunteers(
  rows: ImportRow[],
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, skipped: 0, errors: [] };

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 1;

    if (!validator.isEmail(row.email)) {
      result.errors.push({
        row: rowNum,
        email: row.email,
        reason: "Invalid email format",
      });
      continue;
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, row.email))
      .limit(1);

    if (existing.length > 0) {
      result.skipped++;
      continue;
    }

    try {
      await createVolunteer({
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        employer: row.employer,
        jobTitle: row.jobTitle,
        city: row.city,
        state: row.state,
        referralSource: row.referralSource,
      });
      result.created++;
    } catch (error) {
      result.errors.push({
        row: rowNum,
        email: row.email,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}
