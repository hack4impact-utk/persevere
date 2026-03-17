import { useCallback, useEffect, useState } from "react";

import type { Opportunity } from "@/components/volunteer/types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

// Client-side recommendation type — extends the shared Opportunity shape
// (dates are strings over the wire, so we extend the client Opportunity, not
// the server-side OpportunityWithSpots which uses Date objects)
export type RecommendedOpportunity = Opportunity & {
  matchScore: number;
  matchingSkills: { skillId: number; skillName: string | null }[];
  matchingInterests: { interestId: number; interestName: string | null }[];
};

export type UseRecommendationsResult = {
  recommendations: RecommendedOpportunity[];
  loading: boolean;
  error: string | null;
};

export function useRecommendations(): UseRecommendationsResult {
  const [recommendations, setRecommendations] = useState<
    RecommendedOpportunity[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchRecommendations = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{
        data: RecommendedOpportunity[];
      }>("/api/volunteer/opportunities?recommended=true");
      setRecommendations(result.data ?? []);
    } catch (error_) {
      handleApiError(error_, "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    void fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error };
}
