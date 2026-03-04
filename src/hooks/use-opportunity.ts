import { useEffect, useState } from "react";

import type { Opportunity } from "@/components/volunteer/types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type UseOpportunityResult = {
  opportunity: Opportunity | null;
  loading: boolean;
  error: string | null;
};

export function useOpportunity(id: number | null): UseOpportunityResult {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  useEffect(() => {
    if (id === null) {
      setOpportunity(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async (): Promise<void> => {
      try {
        const result = await apiClient.get<{ data: Opportunity }>(
          `/api/volunteer/opportunities/${id}`,
        );
        if (!cancelled) {
          setOpportunity(result.data);
        }
      } catch (error_) {
        if (cancelled) return;
        if (handleApiError(error_)) return;
        setError(
          error_ instanceof Error
            ? error_.message
            : "Failed to load opportunity",
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
  }, [id, handleApiError]);

  return { opportunity, loading, error };
}
