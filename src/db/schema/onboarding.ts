import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { timestamps } from "./helpers";
import { volunteers } from "./users";

// Staff-managed catalog of onboarding documents
export const onboardingDocuments = pgTable("onboarding_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "pdf" | "video" | "link"
  url: text("url").notNull(), // Vercel Blob URL or external URL
  description: text("description"),
  required: boolean("required").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

// Many-to-many: volunteers who have signed/acknowledged specific documents
export const volunteerDocumentSignatures = pgTable(
  "volunteer_document_signatures",
  {
    volunteerId: integer("volunteer_id")
      .notNull()
      .references(() => volunteers.id, { onDelete: "cascade" }),
    documentId: integer("document_id")
      .notNull()
      .references(() => onboardingDocuments.id, { onDelete: "cascade" }),
    signedAt: timestamp("signed_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.volunteerId, t.documentId] }),
  }),
);

// Relations
export const onboardingDocumentsRelations = relations(
  onboardingDocuments,
  ({ many }) => ({
    signatures: many(volunteerDocumentSignatures),
  }),
);

export const volunteerDocumentSignaturesRelations = relations(
  volunteerDocumentSignatures,
  ({ one }) => ({
    volunteer: one(volunteers, {
      fields: [volunteerDocumentSignatures.volunteerId],
      references: [volunteers.id],
    }),
    document: one(onboardingDocuments, {
      fields: [volunteerDocumentSignatures.documentId],
      references: [onboardingDocuments.id],
    }),
  }),
);
