import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { AuthenticationError } from "@/lib/api-client";
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
} {
  const router = useRouter();
  const [profile, setProfile] = useState<FetchVolunteerByIdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (volunteerId: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVolunteerById(volunteerId);
        setProfile(data);
      } catch (error_) {
        if (error_ instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        setProfile(null);
        setError("Failed to load volunteer profile. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const clearProfile = useCallback((): void => {
    setProfile(null);
    setError(null);
  }, []);

  return { profile, loading, error, loadProfile, clearProfile };
}
