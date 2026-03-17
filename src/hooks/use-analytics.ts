import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import type { AnalyticsStats } from "@/services/analytics.service";

export type { AnalyticsStats } from "@/services/analytics.service";

type State = {
  data: AnalyticsStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useAnalytics(
  startDate: string | null,
  endDate: string | null,
): State {
  const [data, setData] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const handleApiError = useApiErrorHandler(setError);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        const query = params.size > 0 ? `?${params.toString()}` : "";

        const res = await apiClient.get<{ data: AnalyticsStats }>(
          `/api/staff/analytics/stats${query}`,
        );

        if (cancelled) return;

        setData(res.data);
        setError(null);
      } catch (error_) {
        if (cancelled) return;

        setData(null);
        handleApiError(error_, "Failed to load analytics.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void run();

    return (): void => {
      cancelled = true;
    };
  }, [startDate, endDate, handleApiError, refreshCount]);

  const refresh = useCallback((): void => {
    setRefreshCount((c) => c + 1);
  }, []);

  return { data, isLoading, error, refresh };
}
