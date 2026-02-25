import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClient, AuthenticationError } from "@/lib/api-client";

export type UseAttendeesResult = {
  attendees: { firstName: string }[];
  loading: boolean;
  error: string | null;
};

export function useAttendees(id: number | null): UseAttendeesResult {
  const router = useRouter();
  const [attendees, setAttendees] = useState<{ firstName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) {
      setAttendees([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async (): Promise<void> => {
      try {
        const result = await apiClient.get<{
          data: { firstName: string }[];
        }>(`/api/volunteer/opportunities/${id}/attendees`);
        if (!cancelled) {
          setAttendees(result.data);
        }
      } catch (error_) {
        if (cancelled) return;
        if (error_ instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        setError(
          error_ instanceof Error ? error_.message : "Failed to load attendees",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, [id, router]);

  return { attendees, loading, error };
}
