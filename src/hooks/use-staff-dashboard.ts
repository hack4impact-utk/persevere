import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/api-client";

export type StaffUpcomingOpportunity = {
  id: string;
  title: string;
  date: string; // ISO string
  location: string;
};

type StaffDashboardApiResponse =
  | {
      // Flat shape
      activeVolunteers: number;
      totalVolunteerHours: number;
      upcomingOpportunities: number; // count
      pendingRsvps: number; // count
      upcomingOpportunitiesList?: StaffUpcomingOpportunity[];
    }
  | {
      // Nested shape
      stats: {
        activeVolunteers: number;
        totalVolunteerHours: number;
        upcomingOpportunities: number;
        pendingRsvps: number;
      };
      upcomingOpportunities: StaffUpcomingOpportunity[];
    };

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
  const [raw, setRaw] = useState<StaffDashboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      try {
        setIsLoading(true);

        const res = await apiClient.get<StaffDashboardApiResponse>(
          "/api/staff/dashboard/stats",
        );

        if (cancelled) return;

        setRaw(res);
        setError(null);
      } catch (error_) {
        if (cancelled) return;

        setRaw(null);
        setError(
          error_ instanceof Error
            ? error_.message
            : "Failed to load staff dashboard.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void run();

    return (): void => {
      cancelled = true;
    };
  }, []);

  const data = useMemo<StaffDashboardData | null>(() => {
    if (!raw) return null;

    if ("stats" in raw) {
      return {
        activeVolunteers: raw.stats.activeVolunteers ?? 0,
        totalVolunteerHours: raw.stats.totalVolunteerHours ?? 0,
        upcomingOpportunities: raw.stats.upcomingOpportunities ?? 0,
        pendingRsvps: raw.stats.pendingRsvps ?? 0,
        upcomingList: raw.upcomingOpportunities ?? [],
      };
    }

    return {
      activeVolunteers: raw.activeVolunteers ?? 0,
      totalVolunteerHours: raw.totalVolunteerHours ?? 0,
      upcomingOpportunities: raw.upcomingOpportunities ?? 0,
      pendingRsvps: raw.pendingRsvps ?? 0,
      upcomingList: raw.upcomingOpportunitiesList ?? [],
    };
  }, [raw]);

  return { data, isLoading, error };
}
