import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { AvailabilityData } from "@/components/volunteer/availability-editor";
import { apiClient, AuthenticationError } from "@/lib/api-client";

type VolunteerProfileData = {
  volunteers: {
    id: number;
    volunteerType?: string | null;
    notificationPreference?: "email" | "sms" | "both" | "none" | null;
    availability?: AvailabilityData | null;
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
};

type UpdateProfileData = {
  phone?: string | null;
  bio?: string | null;
  availability?: AvailabilityData | null;
  notificationPreference?: "email" | "sms" | "both" | "none" | null;
};

export type UseVolunteerProfileResult = {
  profile: VolunteerProfileData | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
};

export function useVolunteerProfile(): UseVolunteerProfileResult {
  const router = useRouter();
  const [profile, setProfile] = useState<VolunteerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{ data: VolunteerProfileData }>(
        "/api/volunteer/profile",
      );
      setProfile(result.data);
    } catch (error_) {
      if (error_ instanceof AuthenticationError) {
        router.push("/auth/login");
        return;
      }
      const message =
        error_ instanceof Error ? error_.message : "Failed to load profile";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const updateProfile = useCallback(
    async (data: UpdateProfileData): Promise<void> => {
      await apiClient.put("/api/volunteer/profile", data);
    },
    [],
  );

  return { profile, isLoading, error, fetchProfile, updateProfile };
}
