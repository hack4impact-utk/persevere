import { useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import type { VolunteerDashboard } from "@/services/dashboard.service";

export type VolunteerDashboardData = {
  verifiedHours: number;
  pendingHours: number;
  upcomingCount: number;
};

type State = {
  data: VolunteerDashboardData | null;
  isLoading: boolean;
  error: string | null;
};

export function useVolunteerDashboard(): State {
  const [data, setData] = useState<VolunteerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      try {
        setIsLoading(true);

        const res = await apiClient.get<{ data: VolunteerDashboard }>(
          "/api/volunteer/dashboard",
        );

        if (cancelled) return;

        setData({
          verifiedHours: res.data.hours.verified ?? 0,
          pendingHours: res.data.hours.pending ?? 0,
          upcomingCount: res.data.upcomingRsvps.length ?? 0,
        });
        setError(null);
      } catch (error_) {
        if (cancelled) return;

        setData(null);
        handleApiError(error_, "Failed to load dashboard stats.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void run();

    return (): void => {
      cancelled = true;
    };
  }, [handleApiError]);

  return { data, isLoading, error };
}
