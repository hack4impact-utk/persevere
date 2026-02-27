import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  apiClient,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/api-client";
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
  const router = useRouter();
  const [profile, setProfile] = useState<FetchVolunteerByIdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(
    (err: unknown): void => {
      if (err instanceof AuthenticationError) {
        router.push("/auth/login");
      } else if (err instanceof AuthorizationError) {
        setError("Access denied");
      } else {
        console.error("[useVolunteerDetail]", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
      }
    },
    [router],
  );

  const loadProfile = useCallback(
    async (volunteerId: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVolunteerById(volunteerId);
        setProfile(data);
      } catch (error_) {
        handleError(error_);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    },
    [handleError],
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
        handleError(error_);
        return false;
      }
    },
    [handleError],
  );

  const deleteVolunteer = useCallback(
    async (volunteerId: number): Promise<boolean> => {
      try {
        await apiClient.delete(`/api/staff/volunteers/${volunteerId}`);
        return true;
      } catch (error_) {
        handleError(error_);
        return false;
      }
    },
    [handleError],
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
