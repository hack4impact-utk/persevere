import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

type CacheEntry<T> = { data: T; fetchedAt: number };
const CACHE_TTL_MS = 60_000;
let activeTemplatesCache: CacheEntry<EmailTemplate[]> | null = null;
let allTemplatesCache: CacheEntry<EmailTemplate[]> | null = null;

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
  activeTemplates: EmailTemplate[];
  allTemplates: EmailTemplate[];
  loading: boolean;
  error: string | null;
  fetchActiveTemplates: () => Promise<void>;
  fetchAllTemplates: () => Promise<void>;
  createTemplate: (input: CreateTemplateInput) => Promise<void>;
  updateTemplate: (id: number, input: UpdateTemplateInput) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
};

export function useEmailTemplates(): UseEmailTemplatesResult {
  const [activeTemplates, setActiveTemplates] = useState<EmailTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchActiveTemplates = useCallback(async (): Promise<void> => {
    if (isFresh(activeTemplatesCache)) {
      setActiveTemplates(activeTemplatesCache.data);
      return;
    }
    setLoading(true);
    try {
      const json = await apiClient.get<{ data: EmailTemplate[] }>(
        "/api/staff/email-templates",
      );
      activeTemplatesCache = { data: json.data, fetchedAt: Date.now() };
      setActiveTemplates(json.data);
    } catch (error_) {
      handleApiError(error_, "Failed to fetch email templates.");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchAllTemplates = useCallback(async (): Promise<void> => {
    if (isFresh(allTemplatesCache)) {
      setAllTemplates(allTemplatesCache.data);
      return;
    }
    setLoading(true);
    try {
      const json = await apiClient.get<{ data: EmailTemplate[] }>(
        "/api/staff/settings/email-templates",
      );
      allTemplatesCache = { data: json.data, fetchedAt: Date.now() };
      setAllTemplates(json.data);
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
        activeTemplatesCache = null;
        allTemplatesCache = null;
        void fetchAllTemplates();
      } catch (error_) {
        if (!handleApiError(error_)) throw error_;
      }
    },
    [fetchAllTemplates, handleApiError],
  );

  const updateTemplate = useCallback(
    async (id: number, input: UpdateTemplateInput): Promise<void> => {
      try {
        await apiClient.put(`/api/staff/settings/email-templates/${id}`, input);
        activeTemplatesCache = null;
        allTemplatesCache = null;
        void fetchAllTemplates();
      } catch (error_) {
        if (!handleApiError(error_)) throw error_;
      }
    },
    [fetchAllTemplates, handleApiError],
  );

  const deleteTemplate = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/api/staff/settings/email-templates/${id}`);
        activeTemplatesCache = null;
        allTemplatesCache = null;
        void fetchAllTemplates();
      } catch (error_) {
        if (!handleApiError(error_)) throw error_;
      }
    },
    [fetchAllTemplates, handleApiError],
  );

  useEffect(() => {
    void fetchActiveTemplates();
  }, [fetchActiveTemplates]);

  return {
    activeTemplates,
    allTemplates,
    loading,
    error,
    fetchActiveTemplates,
    fetchAllTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
