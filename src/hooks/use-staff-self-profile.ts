import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

type StaffProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  bio: string | null;
  role: "staff" | "admin";
  profilePicture: string | null;
};

type UpdateStaffProfileData = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  bio?: string | null;
};

export type UseStaffSelfProfileResult = {
  profile: StaffProfileData | null;
  loading: boolean;
  isMutating: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (data: UpdateStaffProfileData) => Promise<boolean>;
};

export function useStaffSelfProfile(): UseStaffSelfProfileResult {
  const [profile, setProfile] = useState<StaffProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const loadProfile = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{ data: StaffProfileData }>(
        "/api/staff/profile",
      );
      setProfile(result.data);
    } catch (error_) {
      if (handleApiError(error_)) return;
      const message =
        error_ instanceof Error ? error_.message : "Failed to load profile";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const updateProfile = useCallback(
    async (data: UpdateStaffProfileData): Promise<boolean> => {
      setIsMutating(true);
      setError(null);
      try {
        await apiClient.put("/api/staff/profile", data);
        await loadProfile();
        return true;
      } catch (error_) {
        if (handleApiError(error_)) return false;
        const message =
          error_ instanceof Error ? error_.message : "Failed to update profile";
        setError(message);
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError, loadProfile],
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return { profile, loading, isMutating, error, loadProfile, updateProfile };
}
