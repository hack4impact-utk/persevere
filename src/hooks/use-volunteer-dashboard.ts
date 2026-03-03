import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/api-client";

export type VolunteerRsvp = {
  id: string;
  opportunityId: string;
  title: string;
  date: string; // ISO string
  location: string;
};

type VolunteerDashboardApiResponse =
  | {
      // Flat shape
      volunteer?: {
        firstName?: string | null;
        lastName?: string | null;
      };
      totalHours: number;
      verifiedHours: number;
      rsvps: VolunteerRsvp[];
    }
  | {
      // Nested hours shape
      volunteer?: {
        firstName?: string | null;
        lastName?: string | null;
      };
      hours: {
        totalHours: number;
        verifiedHours: number;
      };
      rsvps: VolunteerRsvp[];
    };

export type VolunteerDashboardData = {
  volunteer: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  totalHours: number;
  verifiedHours: number;
  rsvps: VolunteerRsvp[];
  sortedRsvps: VolunteerRsvp[];
};

type State = {
  data: VolunteerDashboardData | null;
  isLoading: boolean;
  error: string | null;
};

export function useVolunteerDashboard(): State {
  const [raw, setRaw] = useState<VolunteerDashboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      try {
        setIsLoading(true);

        const res = await apiClient.get<VolunteerDashboardApiResponse>(
          "/api/volunteer/dashboard",
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
            : "Failed to load volunteer dashboard.",
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

  const data = useMemo<VolunteerDashboardData | null>(() => {
    if (!raw) return null;

    const totalHours =
      "hours" in raw ? (raw.hours?.totalHours ?? 0) : (raw.totalHours ?? 0);

    const verifiedHours =
      "hours" in raw
        ? (raw.hours?.verifiedHours ?? 0)
        : (raw.verifiedHours ?? 0);

    const rsvps: VolunteerRsvp[] = raw.rsvps ?? [];

    const sortedRsvps: VolunteerRsvp[] = [...rsvps].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return {
      volunteer: raw.volunteer ?? null,
      totalHours,
      verifiedHours,
      rsvps,
      sortedRsvps,
    };
  }, [raw]);

  return { data, isLoading, error };
}
