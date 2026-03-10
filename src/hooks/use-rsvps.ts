import { useCallback, useEffect, useState } from "react";

import type { RsvpItem } from "@/components/volunteer/types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type UseRsvpsResult = {
  upcoming: RsvpItem[];
  past: RsvpItem[];
  loading: boolean;
  error: string | null;
  loadRsvps: () => Promise<void>;
};

export function useRsvps(): UseRsvpsResult {
  const [upcoming, setUpcoming] = useState<RsvpItem[]>([]);
  const [past, setPast] = useState<RsvpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const loadRsvps = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiClient.get<{
        data: { upcoming: RsvpItem[]; past: RsvpItem[] };
      }>("/api/volunteer/rsvps");
      setUpcoming(json.data.upcoming);
      setPast(json.data.past);
    } catch (error_) {
      handleApiError(error_, "Failed to load your RSVPs.");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    void loadRsvps();
  }, [loadRsvps]);

  return { upcoming, past, loading, error, loadRsvps };
}
