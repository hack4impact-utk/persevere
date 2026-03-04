import { useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type UseAttendeesResult = {
  attendees: { firstName: string }[];
  loading: boolean;
  error: string | null;
};

export function useAttendees(id: number | null): UseAttendeesResult {
  const [attendees, setAttendees] = useState<{ firstName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

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
        if (handleApiError(error_)) return;
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
  }, [id, handleApiError]);

  return { attendees, loading, error };
}
