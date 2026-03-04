import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import type { OnboardingStatus } from "@/services/onboarding.service";

export type UseOnboardingResult = {
  status: OnboardingStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useOnboarding(): UseOnboardingResult {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{ data: OnboardingStatus }>(
        "/api/volunteer/onboarding/status",
      );
      setStatus(result.data);
    } catch (error_) {
      if (handleApiError(error_, "Failed to load onboarding status")) return;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { status, isLoading, error, refetch };
}
