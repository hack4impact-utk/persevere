import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

type CacheEntry<T> = { data: T; fetchedAt: number };
const CACHE_TTL_MS = 60_000;
let activeCategoriesCache: CacheEntry<EventCategory[]> | null = null;
let allCategoriesCache: CacheEntry<EventCategory[]> | null = null;

function isFresh<T>(cache: CacheEntry<T> | null): cache is CacheEntry<T> {
  return cache !== null && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

export type EventCategory = {
  id: number;
  name: string;
  isActive: boolean;
};

export type UseEventCategoriesResult = {
  activeCategories: EventCategory[];
  allCategories: EventCategory[];
  loading: boolean;
  error: string | null;
  fetchActiveCategories: () => Promise<void>;
  fetchAllCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  updateCategory: (
    id: number,
    data: { name?: string; isActive?: boolean },
  ) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
};

export function useEventCategories(): UseEventCategoriesResult {
  const [activeCategories, setActiveCategories] = useState<EventCategory[]>([]);
  const [allCategories, setAllCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchActiveCategories = useCallback(async (): Promise<void> => {
    if (isFresh(activeCategoriesCache)) {
      setActiveCategories(activeCategoriesCache.data);
      return;
    }
    setLoading(true);
    try {
      const json = await apiClient.get<{ data: EventCategory[] }>(
        "/api/staff/event-categories",
      );
      activeCategoriesCache = { data: json.data, fetchedAt: Date.now() };
      setActiveCategories(json.data);
    } catch (error_) {
      handleApiError(error_, "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchAllCategories = useCallback(async (): Promise<void> => {
    if (isFresh(allCategoriesCache)) {
      setAllCategories(allCategoriesCache.data);
      return;
    }
    setLoading(true);
    try {
      const json = await apiClient.get<{ data: EventCategory[] }>(
        "/api/staff/settings/event-categories",
      );
      allCategoriesCache = { data: json.data, fetchedAt: Date.now() };
      setAllCategories(json.data);
    } catch (error_) {
      handleApiError(error_, "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const createCategory = useCallback(
    async (name: string): Promise<void> => {
      try {
        await apiClient.post("/api/staff/settings/event-categories", { name });
        activeCategoriesCache = null;
        allCategoriesCache = null;
        void fetchAllCategories();
      } catch (error_) {
        handleApiError(error_, "An unexpected error occurred.");
      }
    },
    [fetchAllCategories, handleApiError],
  );

  const updateCategory = useCallback(
    async (
      id: number,
      data: { name?: string; isActive?: boolean },
    ): Promise<void> => {
      try {
        await apiClient.put(`/api/staff/settings/event-categories/${id}`, data);
        activeCategoriesCache = null;
        allCategoriesCache = null;
        void fetchAllCategories();
      } catch (error_) {
        handleApiError(error_, "An unexpected error occurred.");
      }
    },
    [fetchAllCategories, handleApiError],
  );

  const deleteCategory = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/api/staff/settings/event-categories/${id}`);
        activeCategoriesCache = null;
        allCategoriesCache = null;
        void fetchAllCategories();
      } catch (error_) {
        handleApiError(error_, "An unexpected error occurred.");
      }
    },
    [fetchAllCategories, handleApiError],
  );

  useEffect(() => {
    void fetchActiveCategories();
  }, [fetchActiveCategories]);

  return {
    activeCategories,
    allCategories,
    loading,
    error,
    fetchActiveCategories,
    fetchAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
