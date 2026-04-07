import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

type CacheEntry<T> = { data: T; fetchedAt: number };
const CACHE_TTL_MS = 60_000;
let templatesCache: CacheEntry<EmailTemplate[]> | null = null;

function isFresh<T>(cache: CacheEntry<T> | null): cache is CacheEntry<T> {
  return cache !== null && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

export type EmailTemplate = {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export type UseEmailTemplatesResult = {
  templates: EmailTemplate[];
  loading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  createTemplate: (input: CreateTemplateInput) => Promise<void>;
  updateTemplate: (id: number, input: UpdateTemplateInput) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
};

export function useEmailTemplates(): UseEmailTemplatesResult {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchTemplates = useCallback(async (): Promise<void> => {
    if (isFresh(templatesCache)) {
      setTemplates(templatesCache.data);
      return;
    }
    setLoading(true);
    try {
      const json = await apiClient.get<{ data: EmailTemplate[] }>(
        "/api/staff/settings/email-templates",
      );
      templatesCache = { data: json.data, fetchedAt: Date.now() };
      setTemplates(json.data);
    } catch (error_) {
      handleApiError(error_, "Failed to fetch email templates.");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const createTemplate = useCallback(
    async (input: CreateTemplateInput): Promise<void> => {
      try {
        await apiClient.post("/api/staff/settings/email-templates", input);
        templatesCache = null;
        void fetchTemplates();
      } catch (error_) {
        handleApiError(error_, "Failed to create template.");
      }
    },
    [fetchTemplates, handleApiError],
  );

  const updateTemplate = useCallback(
    async (id: number, input: UpdateTemplateInput): Promise<void> => {
      try {
        await apiClient.put(`/api/staff/settings/email-templates/${id}`, input);
        templatesCache = null;
        void fetchTemplates();
      } catch (error_) {
        handleApiError(error_, "Failed to update template.");
      }
    },
    [fetchTemplates, handleApiError],
  );

  const deleteTemplate = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/api/staff/settings/email-templates/${id}`);
        templatesCache = null;
        void fetchTemplates();
      } catch (error_) {
        handleApiError(error_, "Failed to delete template.");
      }
    },
    [fetchTemplates, handleApiError],
  );

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
