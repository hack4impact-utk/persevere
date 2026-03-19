import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import db from "@/db";
import {
  onboardingDocuments,
  volunteerDocumentSignatures,
  volunteers,
} from "@/db/schema";
import { ConflictError, NotFoundError } from "@/utils/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OnboardingDocument = {
  id: number;
  title: string;
  type: string;
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
};

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["pdf", "video", "link"], {
    message: "Type must be pdf, video, or link",
  }),
  url: z.string().url("URL must be a valid URL"),
  description: z.string().optional(),
  required: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  type: z
    .enum(["pdf", "video", "link"], {
      message: "Type must be pdf, video, or link",
    })
    .optional(),
  url: z.string().url("URL must be a valid URL").optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const signDocumentSchema = z.object({
  documentId: z.number().int().positive("Document ID is required"),
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
  return db
    .select()
    .from(onboardingDocuments)
    .where(eq(onboardingDocuments.isActive, true))
    .orderBy(onboardingDocuments.sortOrder, onboardingDocuments.id);
}

export async function createDocument(
  data: z.infer<typeof createDocumentSchema>,
): Promise<OnboardingDocument> {
  const [doc] = await db.insert(onboardingDocuments).values(data).returning();
  return doc;
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

  return updated;
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
    await del(doc.url);
  }
}

export async function signDocument(
  volunteerId: number,
  documentId: number,
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

  const [signature] = await db
    .insert(volunteerDocumentSignatures)
    .values({ volunteerId, documentId })
    .returning();

  return { documentId: signature.documentId, signedAt: signature.signedAt };
}

export async function getVolunteerSignatures(
  volunteerId: number,
): Promise<DocumentSignature[]> {
  const rows = await db
    .select({
      documentId: volunteerDocumentSignatures.documentId,
      signedAt: volunteerDocumentSignatures.signedAt,
    })
    .from(volunteerDocumentSignatures)
    .where(eq(volunteerDocumentSignatures.volunteerId, volunteerId));

  return rows.map((r) => ({ documentId: r.documentId, signedAt: r.signedAt }));
}
