import { and, desc, eq } from "drizzle-orm";

import db from "@/db";
import { communicationTemplates } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/utils/errors";

export type EmailTemplate = {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: string;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTemplateInput = {
  name: string;
  subject: string;
  body: string;
  type: string;
  category?: string | null;
};

export type UpdateTemplateInput = {
  name?: string;
  subject?: string;
  body?: string;
  type?: string;
  category?: string | null;
  isActive?: boolean;
};

/**
 * List all communication templates (active and inactive).
 * Admin-only feature.
 */
export async function listTemplates(): Promise<EmailTemplate[]> {
  const templates = await db
    .select()
    .from(communicationTemplates)
    .orderBy(desc(communicationTemplates.createdAt));

  return templates;
}

/**
 * List only active communication templates.
 * Used for template selection in compose UI.
 */
export async function listActiveTemplates(): Promise<EmailTemplate[]> {
  const templates = await db
    .select()
    .from(communicationTemplates)
    .where(eq(communicationTemplates.isActive, true))
    .orderBy(desc(communicationTemplates.createdAt));

  return templates;
}

/**
 * Get a single template by ID.
 */
export async function getTemplateById(id: number): Promise<EmailTemplate> {
  const [template] = await db
    .select()
    .from(communicationTemplates)
    .where(eq(communicationTemplates.id, id))
    .limit(1);

  if (!template) {
    throw new NotFoundError("Template not found");
  }

  return template;
}

/**
 * Create a new communication template.
 * Validates that the name is unique among active templates.
 */
export async function createTemplate(
  input: CreateTemplateInput,
): Promise<EmailTemplate> {
  // Check for duplicate name among active templates
  const [existing] = await db
    .select()
    .from(communicationTemplates)
    .where(
      and(
        eq(communicationTemplates.name, input.name),
        eq(communicationTemplates.isActive, true),
      ),
    )
    .limit(1);

  if (existing) {
    throw new ConflictError("A template with this name already exists");
  }

  const [newTemplate] = await db
    .insert(communicationTemplates)
    .values({
      name: input.name,
      subject: input.subject,
      body: input.body,
      type: input.type,
      category: input.category ?? null,
      isActive: true,
    })
    .returning();

  return newTemplate;
}

/**
 * Update an existing communication template.
 * Validates name uniqueness if name is being changed.
 */
export async function updateTemplate(
  id: number,
  input: UpdateTemplateInput,
): Promise<EmailTemplate> {
  // Check if template exists
  const [existing] = await db
    .select()
    .from(communicationTemplates)
    .where(eq(communicationTemplates.id, id))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("Template not found");
  }

  // If name is being changed, check for duplicates among active templates
  if (input.name && input.name !== existing.name) {
    const [duplicate] = await db
      .select()
      .from(communicationTemplates)
      .where(
        and(
          eq(communicationTemplates.name, input.name),
          eq(communicationTemplates.isActive, true),
        ),
      )
      .limit(1);

    if (duplicate && duplicate.id !== id) {
      throw new ConflictError("A template with this name already exists");
    }
  }

  const [updated] = await db
    .update(communicationTemplates)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(communicationTemplates.id, id))
    .returning();

  return updated;
}

/**
 * Permanently delete a template from the database.
 */
export async function deleteTemplate(id: number): Promise<void> {
  const [existing] = await db
    .select()
    .from(communicationTemplates)
    .where(eq(communicationTemplates.id, id))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("Template not found");
  }

  await db
    .delete(communicationTemplates)
    .where(eq(communicationTemplates.id, id));
}
