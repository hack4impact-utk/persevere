import { useCallback, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import type { VolunteerMatch } from "@/services/recommendation.service";

export type UseVolunteerMatchesResult = {
  matches: VolunteerMatch[];
  loading: boolean;
  error: string | null;
  fetchMatches: (eventId: string) => Promise<void>;
};

export function useVolunteerMatches(): UseVolunteerMatchesResult {
  const [matches, setMatches] = useState<VolunteerMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchMatches = useCallback(
    async (eventId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.get<{ data: VolunteerMatch[] }>(
          `/api/staff/calendar/events/${eventId}/volunteer-matches`,
        );
        setMatches(result.data ?? []);
      } catch (error_) {
        handleApiError(error_, "Failed to load volunteer matches.");
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  return { matches, loading, error, fetchMatches };
}

export { type VolunteerMatch } from "@/services/recommendation.service";
