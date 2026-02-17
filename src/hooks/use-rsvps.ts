import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { RsvpItem } from "@/components/volunteer/types";
import { apiClient, AuthenticationError } from "@/lib/api-client";

export type UseRsvpsResult = {
  upcoming: RsvpItem[];
  loading: boolean;
  error: string | null;
  loadRsvps: () => Promise<void>;
};

export function useRsvps(): UseRsvpsResult {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<RsvpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRsvps = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiClient.get<{ data: { upcoming: RsvpItem[] } }>(
        "/api/volunteer/rsvps",
      );
      setUpcoming(json.data.upcoming);
    } catch (error_) {
      if (error_ instanceof AuthenticationError) {
        router.push("/auth/login");
        return;
      }

      console.error("[useRsvps] Failed to load RSVPs:", error_);
      setError("Failed to load your RSVPs.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadRsvps();
  }, [loadRsvps]);

  return { upcoming, loading, error, loadRsvps };
}
