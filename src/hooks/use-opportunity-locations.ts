import { useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type UseOpportunityLocationsResult = {
  locations: string[];
  loading: boolean;
  error: string | null;
};

export function useOpportunityLocations(): UseOpportunityLocationsResult {
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async (): Promise<void> => {
      try {
        const result = await apiClient.get<{ data: string[] }>(
          "/api/volunteer/opportunity-locations",
        );
        if (!cancelled) {
          setLocations(result.data);
        }
      } catch (error_) {
        if (cancelled) return;
        if (handleApiError(error_)) return;
        setError(
          error_ instanceof Error ? error_.message : "Failed to load locations",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, [handleApiError]);

  return { locations, loading, error };
}
