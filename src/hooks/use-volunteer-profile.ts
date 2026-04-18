import { useCallback, useEffect, useState } from "react";

import type { AvailabilityData } from "@/components/volunteer/availability-editor";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

type VolunteerProfileData = {
  volunteers: {
    id: number;
    volunteerType?: string | null;
    notificationPreference?: "email" | "sms" | "both" | "none" | null;
    availability?: AvailabilityData | null;
    employer?: string | null;
    jobTitle?: string | null;
    city?: string | null;
    state?: string | null;
    referralSource?: string | null;
    isAlumni?: boolean | null;
  };
  users: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
    bio?: string | null;
    profilePicture?: string | null;
  };
  totalHours: number;
  skills: {
    skillId: number;
    skillName: string | null;
    skillDescription: string | null;
    skillCategory: string | null;
    proficiencyLevel:
      | "no_selection"
      | "beginner"
      | "intermediate"
      | "advanced"
      | null;
  }[];
  interests: {
    interestId: number;
    interestName: string | null;
    interestDescription: string | null;
  }[];
};

type UpdateProfileData = {
  phone?: string | null;
  bio?: string | null;
  availability?: AvailabilityData | null;
  notificationPreference?: "email" | "sms" | "both" | "none" | null;
  employer?: string | null;
  jobTitle?: string | null;
  city?: string | null;
  state?: string | null;
  referralSource?: string | null;
  isAlumni?: boolean | null;
};

export type UseVolunteerProfileResult = {
  profile: VolunteerProfileData | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
};

export function useVolunteerProfile(): UseVolunteerProfileResult {
  const [profile, setProfile] = useState<VolunteerProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchProfile = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{ data: VolunteerProfileData }>(
        "/api/volunteer/profile",
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
    async (data: UpdateProfileData): Promise<void> => {
      await apiClient.put("/api/volunteer/profile", data);
    },
    [],
  );

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, fetchProfile, updateProfile };
}
