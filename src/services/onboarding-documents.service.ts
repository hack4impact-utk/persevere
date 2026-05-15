import { getStore } from "@netlify/blobs";
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

const ONBOARDING_BLOB_PATH_REGEX =
  /^\/api\/files\/onboarding-documents\/[a-f0-9-]+(?:\.[a-z0-9]+)?$/i;

const documentUrlSchema = z.string().refine((value) => {
  if (ONBOARDING_BLOB_PATH_REGEX.test(value)) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}, "URL must be a valid URL");

export const createDocumentSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(["pdf", "video", "link"], {
      message: "Type must be pdf, video, or link",
    }),
    actionType: z
      .enum(["sign", "consent", "acknowledge", "informational"])
      .default("sign"),
    url: documentUrlSchema,
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
    url: documentUrlSchema.optional(),
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

const ONBOARDING_BLOB_PREFIX = "/api/files/onboarding-documents/";

function extractBlobKey(url: string): string | null {
  if (!url.startsWith(ONBOARDING_BLOB_PREFIX)) return null;
  const key = url.slice(ONBOARDING_BLOB_PREFIX.length);
  return key.length > 0 ? key : null;
}

async function deleteOnboardingBlob(
  url: string,
  documentId: number,
): Promise<void> {
  const key = extractBlobKey(url);
  if (!key) return;
  try {
    await getStore("onboarding-documents").delete(key);
  } catch (error) {
    console.error(`Failed to delete blob for document ${documentId}:`, error);
  }
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

  if (data.url && data.url !== existing[0].url) {
    await deleteOnboardingBlob(existing[0].url, id);
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
  await deleteOnboardingBlob(existing[0].url, id);
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

// ---------------------------------------------------------------------------
// Combined document + signature view (active docs only)
// ---------------------------------------------------------------------------

export type DocumentWithSignature = {
  id: number;
  title: string;
  type: DocumentType;
  actionType: DocumentActionType;
  required: boolean;
  signedAt: Date | null;
  consentGiven: boolean | null;
};

/**
 * Returns all active onboarding documents joined with the volunteer's
 * signature record (if any). Inactive/deleted documents are excluded even
 * if the volunteer previously signed them.
 */
export async function listDocumentsWithSignatures(
  volunteerId: number,
): Promise<DocumentWithSignature[]> {
  const rows = await db
    .select({
      id: onboardingDocuments.id,
      title: onboardingDocuments.title,
      type: onboardingDocuments.type,
      actionType: onboardingDocuments.actionType,
      required: onboardingDocuments.required,
      signedAt: volunteerDocumentSignatures.signedAt,
      consentGiven: volunteerDocumentSignatures.consentGiven,
    })
    .from(onboardingDocuments)
    .leftJoin(
      volunteerDocumentSignatures,
      and(
        eq(volunteerDocumentSignatures.documentId, onboardingDocuments.id),
        eq(volunteerDocumentSignatures.volunteerId, volunteerId),
      ),
    )
    .where(eq(onboardingDocuments.isActive, true))
    .orderBy(onboardingDocuments.sortOrder, onboardingDocuments.id);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type as DocumentType,
    actionType: r.actionType as DocumentActionType,
    required: r.required,
    signedAt: r.signedAt ?? null,
    consentGiven: r.consentGiven ?? null,
  }));
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
