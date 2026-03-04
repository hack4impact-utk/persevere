import { useCallback, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import {
  fetchStaffById,
  type FetchStaffByIdResult,
} from "@/services/staff.service";

export function useStaffProfile(): {
  profile: FetchStaffByIdResult | null;
  loading: boolean;
  error: string | null;
  loadProfile: (staffId: number) => Promise<void>;
  clearProfile: () => void;
} {
  const [profile, setProfile] = useState<FetchStaffByIdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const loadProfile = useCallback(
    async (staffId: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStaffById(staffId);
        setProfile(data);
      } catch (error_) {
        if (
          handleApiError(
            error_,
            "Failed to load staff profile. Please try again.",
          )
        )
          return;
        setProfile(null);
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  const clearProfile = useCallback((): void => {
    setProfile(null);
    setError(null);
  }, []);

  return { profile, loading, error, loadProfile, clearProfile };
}
