import { and, eq, sql } from "drizzle-orm";

import db from "@/db";
import {
  onboardingDocuments,
  users,
  volunteerDocumentSignatures,
  volunteerHours,
  volunteers,
} from "@/db/schema";
import { toNumber } from "@/services/shared/db-helpers";

type ActiveDoc = {
  id: number;
  title: string;
  actionType: string;
};

type VolunteerExportRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employer: string;
  jobTitle: string;
  paperwork: Record<number, string>;
  cityState: string;
  verifiedHours: number;
  eventsAttended: number;
  referralSource: string;
};

export type VolunteerExportData = {
  docs: ActiveDoc[];
  rows: VolunteerExportRow[];
};

function formatSignature(
  signedAt: Date,
  actionType: string,
  consentGiven: boolean | null,
): string {
  const date = signedAt.toISOString().split("T")[0];
  switch (actionType) {
    case "consent": {
      return `${date} (${consentGiven ? "consented" : "declined"})`;
    }
    case "sign": {
      return `${date} (signed)`;
    }
    case "acknowledge": {
      return `${date} (acknowledged)`;
    }
    case "informational": {
      return `${date} (viewed)`;
    }
    default: {
      return `${date} (completed)`;
    }
  }
}

export async function getVolunteerExportData(): Promise<VolunteerExportData> {
  const [docs, volunteerRows, signatureRows] = await Promise.all([
    // All active onboarding documents (for dynamic column headers)
    db
      .select({
        id: onboardingDocuments.id,
        title: onboardingDocuments.title,
        actionType: onboardingDocuments.actionType,
      })
      .from(onboardingDocuments)
      .where(eq(onboardingDocuments.isActive, true))
      .orderBy(onboardingDocuments.sortOrder, onboardingDocuments.id),

    // All active, email-verified volunteers with aggregated hours/events
    db
      .select({
        volunteerId: volunteers.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        employer: volunteers.employer,
        jobTitle: volunteers.jobTitle,
        city: volunteers.city,
        state: volunteers.state,
        referralSource: volunteers.referralSource,
        verifiedHours: sql<string>`coalesce(sum(${volunteerHours.hours}) filter (where ${volunteerHours.status} = 'approved'), 0)`,
        eventsAttended: sql<string>`count(distinct ${volunteerHours.opportunityId})`,
      })
      .from(volunteers)
      .innerJoin(users, eq(volunteers.userId, users.id))
      .leftJoin(volunteerHours, eq(volunteerHours.volunteerId, volunteers.id))
      .where(and(eq(users.isActive, true), eq(users.isEmailVerified, true)))
      .groupBy(
        volunteers.id,
        users.firstName,
        users.lastName,
        users.email,
        users.phone,
        volunteers.employer,
        volunteers.jobTitle,
        volunteers.city,
        volunteers.state,
        volunteers.referralSource,
      )
      .orderBy(users.lastName, users.firstName),

    // All signatures for active documents (batch fetch — no N+1)
    db
      .select({
        volunteerId: volunteerDocumentSignatures.volunteerId,
        documentId: volunteerDocumentSignatures.documentId,
        signedAt: volunteerDocumentSignatures.signedAt,
        consentGiven: volunteerDocumentSignatures.consentGiven,
        actionType: onboardingDocuments.actionType,
      })
      .from(volunteerDocumentSignatures)
      .innerJoin(
        onboardingDocuments,
        eq(volunteerDocumentSignatures.documentId, onboardingDocuments.id),
      )
      .where(eq(onboardingDocuments.isActive, true)),
  ]);

  // Build lookup: volunteerId → docId → formatted value
  const sigMap = new Map<number, Map<number, string>>();
  for (const sig of signatureRows) {
    if (!sigMap.has(sig.volunteerId)) {
      sigMap.set(sig.volunteerId, new Map());
    }
    sigMap
      .get(sig.volunteerId)!
      .set(
        sig.documentId,
        formatSignature(sig.signedAt, sig.actionType, sig.consentGiven ?? null),
      );
  }

  const rows: VolunteerExportRow[] = volunteerRows.map((v) => {
    const volSigs = sigMap.get(v.volunteerId) ?? new Map<number, string>();
    const paperwork: Record<number, string> = {};
    for (const doc of docs) {
      paperwork[doc.id] = volSigs.get(doc.id) ?? "";
    }

    const cityParts = [v.city, v.state].filter(Boolean);

    return {
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      phone: v.phone ?? "",
      employer: v.employer ?? "",
      jobTitle: v.jobTitle ?? "",
      paperwork,
      cityState: cityParts.join(", "),
      verifiedHours: toNumber(v.verifiedHours),
      eventsAttended: toNumber(v.eventsAttended),
      referralSource: v.referralSource ?? "",
    };
  });

  return { docs, rows };
}
