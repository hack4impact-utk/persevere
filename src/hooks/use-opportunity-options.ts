import { useEffect, useRef, useState } from "react";

import type { Opportunity } from "@/components/volunteer/types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type UseOpportunityOptionsResult = {
  opportunities: Opportunity[];
  loading: boolean;
};

/**
 * Fetches a flat list of opportunities for use in dropdowns (e.g. log-hours modal).
 * Only fetches when `enabled` is true (pass the modal's `open` prop).
 */
export function useOpportunityOptions(
  enabled: boolean,
): UseOpportunityOptionsResult {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const handleApiErrorRef = useRef(handleApiError);
  handleApiErrorRef.current = handleApiError;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const result = await apiClient.get<{
          data: Opportunity[];
          total: number;
        }>("/api/volunteer/opportunities?limit=100&offset=0");
        if (!cancelled) {
          setOpportunities(result.data);
        }
      } catch (error_) {
        if (cancelled) return;
        handleApiErrorRef.current(error_, "Failed to load opportunities");
        setOpportunities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return (): void => {
      cancelled = true;
    };
  }, [enabled]);

  return { opportunities, loading };
}
