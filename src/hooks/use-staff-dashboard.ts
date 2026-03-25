import { useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import type {
  PendingHoursEntry,
  RecentActivityItem,
  StaffDashboardStats,
  StaffUpcomingOpportunity,
} from "@/services/dashboard.service";

export type {
  PendingHoursEntry,
  RecentActivityItem,
  StaffUpcomingOpportunity,
} from "@/services/dashboard.service";

export type StaffDashboardData = {
  activeVolunteers: number;
  totalVolunteerHours: number;
  upcomingOpportunities: number;
  pendingRsvps: number;
  upcomingList: StaffUpcomingOpportunity[];
  pendingHoursCount: number;
  onboardingIncomplete: number;
  pendingHoursList: PendingHoursEntry[];
  recentActivity: RecentActivityItem[];
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
          pendingHoursCount: res.data.pendingHoursCount ?? 0,
          onboardingIncomplete: res.data.onboardingIncomplete ?? 0,
          pendingHoursList: res.data.pendingHoursList ?? [],
          recentActivity: res.data.recentActivity ?? [],
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
