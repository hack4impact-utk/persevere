import { useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

type Category = { id: number; name: string };

export type UseOpportunityCategoriesResult = {
  categories: Category[];
  loading: boolean;
  error: string | null;
};

export function useOpportunityCategories(): UseOpportunityCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async (): Promise<void> => {
      try {
        const result = await apiClient.get<{ data: Category[] }>(
          "/api/volunteer/opportunity-categories",
        );
        if (!cancelled) {
          setCategories(result.data);
        }
      } catch (error_) {
        if (cancelled) return;
        if (handleApiError(error_)) return;
        setError(
          error_ instanceof Error
            ? error_.message
            : "Failed to load categories",
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

  return { categories, loading, error };
}
