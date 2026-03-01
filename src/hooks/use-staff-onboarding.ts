import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { apiClient, AuthenticationError } from "@/lib/api-client";
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

const PAGE_SIZE = 10;

export function useStaffOnboarding(): UseStaffOnboardingResult {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<VolunteerOnboardingSummary[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
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
      if (error_ instanceof AuthenticationError) {
        router.push("/auth/login");
        return;
      }
      setError(
        error_ instanceof Error
          ? error_.message
          : "Failed to load onboarding data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, page, search]);

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
