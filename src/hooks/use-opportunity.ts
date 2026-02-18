import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Opportunity } from "@/components/volunteer/types";
import { apiClient, AuthenticationError } from "@/lib/api-client";

export type UseOpportunityResult = {
  opportunity: Opportunity | null;
  loading: boolean;
  error: string | null;
};

export function useOpportunity(id: number | null): UseOpportunityResult {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (error_ instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
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
  }, [id, router]);

  return { opportunity, loading, error };
}
