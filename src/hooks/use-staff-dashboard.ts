import { useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import type {
  StaffDashboardStats,
  StaffUpcomingOpportunity,
} from "@/services/dashboard.service";

export type { StaffUpcomingOpportunity } from "@/services/dashboard.service";

export type StaffDashboardData = {
  activeVolunteers: number;
  totalVolunteerHours: number;
  upcomingOpportunities: number;
  pendingRsvps: number;
  upcomingList: StaffUpcomingOpportunity[];
};

type State = {
  data: StaffDashboardData | null;
  isLoading: boolean;
  error: string | null;
};

export function useStaffDashboard(): State {
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      try {
        setIsLoading(true);

        const res = await apiClient.get<{ data: StaffDashboardStats }>(
          "/api/staff/dashboard/stats",
        );

        if (cancelled) return;

        setData({
          activeVolunteers: res.data.activeVolunteers ?? 0,
          totalVolunteerHours: res.data.totalVolunteerHours ?? 0,
          upcomingOpportunities: res.data.upcomingOpportunities ?? 0,
          pendingRsvps: res.data.pendingRsvps ?? 0,
          upcomingList: res.data.upcomingList ?? [],
        });
        setError(null);
      } catch (error_) {
        if (cancelled) return;

        setData(null);
        handleApiError(error_, "Failed to load staff dashboard.");
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
