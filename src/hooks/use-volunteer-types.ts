import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

type CacheEntry<T> = { data: T; fetchedAt: number };
const CACHE_TTL_MS = 60_000;
let activeTypesCache: CacheEntry<VolunteerType[]> | null = null;
let allTypesCache: CacheEntry<VolunteerType[]> | null = null;

function isFresh<T>(cache: CacheEntry<T> | null): cache is CacheEntry<T> {
  return cache !== null && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

export type VolunteerType = {
  id: number;
  name: string;
  isActive: boolean;
};

export type UseVolunteerTypesResult = {
  activeTypes: VolunteerType[];
  allTypes: VolunteerType[];
  loading: boolean;
  error: string | null;
  fetchActiveTypes: () => Promise<void>;
  fetchAllTypes: () => Promise<void>;
  createType: (name: string) => Promise<void>;
  updateType: (
    id: number,
    data: { name?: string; isActive?: boolean },
  ) => Promise<void>;
  deleteType: (id: number) => Promise<void>;
};

export function useVolunteerTypes(): UseVolunteerTypesResult {
  const [activeTypes, setActiveTypes] = useState<VolunteerType[]>([]);
  const [allTypes, setAllTypes] = useState<VolunteerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchActiveTypes = useCallback(async (): Promise<void> => {
    if (isFresh(activeTypesCache)) {
      setActiveTypes(activeTypesCache.data);
      return;
    }
    setLoading(true);
    try {
      const json = await apiClient.get<{ data: VolunteerType[] }>(
        "/api/staff/volunteer-types",
      );
      activeTypesCache = { data: json.data, fetchedAt: Date.now() };
      setActiveTypes(json.data);
    } catch (error_) {
      handleApiError(error_, "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchAllTypes = useCallback(async (): Promise<void> => {
    if (isFresh(allTypesCache)) {
      setAllTypes(allTypesCache.data);
      return;
    }
    setLoading(true);
    try {
      const json = await apiClient.get<{ data: VolunteerType[] }>(
        "/api/staff/settings/volunteer-types",
      );
      allTypesCache = { data: json.data, fetchedAt: Date.now() };
      setAllTypes(json.data);
    } catch (error_) {
      handleApiError(error_, "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const createType = useCallback(
    async (name: string): Promise<void> => {
      try {
        await apiClient.post("/api/staff/settings/volunteer-types", { name });
        activeTypesCache = null;
        allTypesCache = null;
        void fetchAllTypes();
      } catch (error_) {
        handleApiError(error_, "An unexpected error occurred.");
      }
    },
    [fetchAllTypes, handleApiError],
  );

  const updateType = useCallback(
    async (
      id: number,
      data: { name?: string; isActive?: boolean },
    ): Promise<void> => {
      try {
        await apiClient.put(`/api/staff/settings/volunteer-types/${id}`, data);
        activeTypesCache = null;
        allTypesCache = null;
        void fetchAllTypes();
      } catch (error_) {
        handleApiError(error_, "An unexpected error occurred.");
      }
    },
    [fetchAllTypes, handleApiError],
  );

  const deleteType = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiClient.delete(`/api/staff/settings/volunteer-types/${id}`);
        activeTypesCache = null;
        allTypesCache = null;
        void fetchAllTypes();
      } catch (error_) {
        handleApiError(error_, "An unexpected error occurred.");
      }
    },
    [fetchAllTypes, handleApiError],
  );

  useEffect(() => {
    void fetchActiveTypes();
  }, [fetchActiveTypes]);

  return {
    activeTypes,
    allTypes,
    loading,
    error,
    fetchActiveTypes,
    fetchAllTypes,
    createType,
    updateType,
    deleteType,
  };
}
