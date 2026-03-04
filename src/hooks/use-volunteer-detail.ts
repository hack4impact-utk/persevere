import { useCallback, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import {
  fetchVolunteerById,
  type FetchVolunteerByIdResult,
} from "@/services/volunteer-client.service";

export function useVolunteerDetail(): {
  profile: FetchVolunteerByIdResult | null;
  loading: boolean;
  error: string | null;
  loadProfile: (volunteerId: number) => Promise<void>;
  clearProfile: () => void;
  updateVolunteer: (
    volunteerId: number,
    data: Record<string, unknown>,
  ) => Promise<boolean>;
  deleteVolunteer: (volunteerId: number) => Promise<boolean>;
} {
  const [profile, setProfile] = useState<FetchVolunteerByIdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const loadProfile = useCallback(
    async (volunteerId: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVolunteerById(volunteerId);
        setProfile(data);
      } catch (error_) {
        if (handleApiError(error_)) return;
        console.error("[useVolunteerDetail]", error_);
        setError(
          error_ instanceof Error
            ? error_.message
            : "An unexpected error occurred.",
        );
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

  const updateVolunteer = useCallback(
    async (
      volunteerId: number,
      data: Record<string, unknown>,
    ): Promise<boolean> => {
      try {
        await apiClient.put(`/api/staff/volunteers/${volunteerId}`, data);
        return true;
      } catch (error_) {
        if (handleApiError(error_)) return false;
        console.error("[useVolunteerDetail]", error_);
        setError(
          error_ instanceof Error
            ? error_.message
            : "An unexpected error occurred.",
        );
        return false;
      }
    },
    [handleApiError],
  );

  const deleteVolunteer = useCallback(
    async (volunteerId: number): Promise<boolean> => {
      try {
        await apiClient.delete(`/api/staff/volunteers/${volunteerId}`);
        return true;
      } catch (error_) {
        if (handleApiError(error_)) return false;
        console.error("[useVolunteerDetail]", error_);
        setError(
          error_ instanceof Error
            ? error_.message
            : "An unexpected error occurred.",
        );
        return false;
      }
    },
    [handleApiError],
  );

  return {
    profile,
    loading,
    error,
    loadProfile,
    clearProfile,
    updateVolunteer,
    deleteVolunteer,
  };
}
