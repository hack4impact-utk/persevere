import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { AuthenticationError } from "@/lib/api-client";
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
  const router = useRouter();
  const [profile, setProfile] = useState<FetchStaffByIdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (staffId: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStaffById(staffId);
        setProfile(data);
      } catch (error_) {
        if (error_ instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        setProfile(null);
        setError("Failed to load staff profile. Please try again.");
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
