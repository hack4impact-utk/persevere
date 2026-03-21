import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import db from "@/db";
import {
  onboardingDocuments,
  volunteerDocumentSignatures,
  volunteers,
} from "@/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/utils/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentType = "pdf" | "video" | "link";
export type DocumentActionType =
  | "sign"
  | "consent"
  | "acknowledge"
  | "informational";

export type OnboardingDocument = {
  id: number;
  title: string;
  type: DocumentType;
  actionType: DocumentActionType;
  url: string;
  description: string | null;
  required: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DocumentSignature = {
  documentId: number;
  signedAt: Date;
  consentGiven: boolean | null;
};

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

export const createDocumentSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(["pdf", "video", "link"], {
      message: "Type must be pdf, video, or link",
    }),
    actionType: z
      .enum(["sign", "consent", "acknowledge", "informational"])
      .default("sign"),
    url: z.string().url("URL must be a valid URL"),
    description: z.string().optional(),
    required: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })
  .refine(
    (data) => !(data.required === true && data.actionType === "informational"),
    { message: "Informational documents cannot be marked as required" },
  );

export const updateDocumentSchema = z
  .object({
    title: z.string().min(1, "Title is required").optional(),
    type: z
      .enum(["pdf", "video", "link"], {
        message: "Type must be pdf, video, or link",
      })
      .optional(),
    actionType: z
      .enum(["sign", "consent", "acknowledge", "informational"])
      .optional(),
    url: z.string().url("URL must be a valid URL").optional(),
    description: z.string().optional(),
    required: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => !(data.required === true && data.actionType === "informational"),
    { message: "Informational documents cannot be marked as required" },
  );

export const signDocumentSchema = z.object({
  documentId: z.number().int().positive("Document ID is required"),
  consentGiven: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isVercelBlobUrl(url: string): boolean {
  return url.includes("blob.vercel-storage.com");
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function listDocuments(): Promise<OnboardingDocument[]> {
  const rows = await db
    .select()
    .from(onboardingDocuments)
    .where(eq(onboardingDocuments.isActive, true))
    .orderBy(onboardingDocuments.sortOrder, onboardingDocuments.id);
  return rows as unknown as OnboardingDocument[];
}

export async function createDocument(
  data: z.infer<typeof createDocumentSchema>,
): Promise<OnboardingDocument> {
  const [doc] = await db.insert(onboardingDocuments).values(data).returning();
  return doc as unknown as OnboardingDocument;
}

export async function updateDocument(
  id: number,
  data: z.infer<typeof updateDocumentSchema>,
): Promise<OnboardingDocument> {
  const existing = await db
    .select()
    .from(onboardingDocuments)
    .where(eq(onboardingDocuments.id, id))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError("Document not found");
  }

  const [updated] = await db
    .update(onboardingDocuments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(onboardingDocuments.id, id))
    .returning();

  // Clean up old blob when the URL is replaced
  if (
    data.url &&
    data.url !== existing[0].url &&
    isVercelBlobUrl(existing[0].url)
  ) {
    try {
      await del(existing[0].url);
    } catch (error) {
      console.error(`Failed to delete old blob for document ${id}:`, error);
    }
  }

  return updated as unknown as OnboardingDocument;
}

export async function deleteDocument(id: number): Promise<void> {
  const existing = await db
    .select()
    .from(onboardingDocuments)
    .where(eq(onboardingDocuments.id, id))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundError("Document not found");
  }

  await db.delete(onboardingDocuments).where(eq(onboardingDocuments.id, id));

  // Clean up Vercel Blob storage if the file was uploaded (not an external URL)
  const doc = existing[0];
  if (isVercelBlobUrl(doc.url)) {
    try {
      await del(doc.url);
    } catch (error) {
      console.error(`Failed to delete blob for document ${id}:`, error);
      // DB record is already deleted — log and continue
    }
  }
}

export async function signDocument(
  volunteerId: number,
  documentId: number,
  consentGiven?: boolean,
): Promise<DocumentSignature> {
  const volunteer = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId))
    .limit(1);

  if (volunteer.length === 0) {
    throw new NotFoundError("Volunteer not found");
  }

  const doc = await db
    .select()
    .from(onboardingDocuments)
    .where(
      and(
        eq(onboardingDocuments.id, documentId),
        eq(onboardingDocuments.isActive, true),
      ),
    )
    .limit(1);

  if (doc.length === 0) {
    throw new NotFoundError("Document not found or inactive");
  }

  const { actionType } = doc[0];

  if (actionType === "informational") {
    throw new ValidationError(
      "Informational documents do not require a response",
    );
  }

  if (actionType === "consent" && consentGiven === undefined) {
    throw new ValidationError(
      "Consent documents require a consentGiven value (true or false)",
    );
  }

  const existing = await db
    .select()
    .from(volunteerDocumentSignatures)
    .where(
      and(
        eq(volunteerDocumentSignatures.volunteerId, volunteerId),
        eq(volunteerDocumentSignatures.documentId, documentId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError("Document already signed");
  }

  const resolvedConsent =
    actionType === "consent" ? (consentGiven ?? null) : null;

  const [signature] = await db
    .insert(volunteerDocumentSignatures)
    .values({ volunteerId, documentId, consentGiven: resolvedConsent })
    .returning();

  return {
    documentId: signature.documentId,
    signedAt: signature.signedAt,
    consentGiven: signature.consentGiven ?? null,
  };
}

export async function getVolunteerSignatures(
  volunteerId: number,
): Promise<DocumentSignature[]> {
  const rows = await db
    .select({
      documentId: volunteerDocumentSignatures.documentId,
      signedAt: volunteerDocumentSignatures.signedAt,
      consentGiven: volunteerDocumentSignatures.consentGiven,
    })
    .from(volunteerDocumentSignatures)
    .where(eq(volunteerDocumentSignatures.volunteerId, volunteerId));

  return rows.map((r) => ({
    documentId: r.documentId,
    signedAt: r.signedAt,
    consentGiven: r.consentGiven ?? null,
  }));
}
