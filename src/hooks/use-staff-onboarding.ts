import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { VolunteerOnboardingSummary } from "@/services/onboarding.service";

export type UseStaffOnboardingResult = {
  volunteers: VolunteerOnboardingSummary[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;
  refetch: () => Promise<void>;
};

type OnboardingListResponse = {
  data: VolunteerOnboardingSummary[];
  total: number;
};

export function useStaffOnboarding(): UseStaffOnboardingResult {
  const [volunteers, setVolunteers] = useState<VolunteerOnboardingSummary[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const handleApiError = useApiErrorHandler(setError);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(DEFAULT_PAGE_SIZE),
      });
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const result = await apiClient.get<OnboardingListResponse>(
        `/api/staff/onboarding?${params.toString()}`,
      );
      setVolunteers(result.data);
      setTotal(result.total);
    } catch (error_) {
      if (handleApiError(error_, "Failed to load onboarding data")) return;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, page, search]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    volunteers,
    total,
    isLoading,
    error,
    page,
    setPage,
    search,
    setSearch,
    refetch,
  };
}
