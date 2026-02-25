import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { apiClient, AuthenticationError } from "@/lib/api-client";
import type { OnboardingStatus } from "@/services/onboarding.service";

export type UseOnboardingResult = {
  status: OnboardingStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useOnboarding(): UseOnboardingResult {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{ data: OnboardingStatus }>(
        "/api/volunteer/onboarding/status",
      );
      setStatus(result.data);
    } catch (error_) {
      if (error_ instanceof AuthenticationError) {
        router.push("/auth/login");
        return;
      }
      setError(
        error_ instanceof Error
          ? error_.message
          : "Failed to load onboarding status",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { status, isLoading, error, refetch };
}
