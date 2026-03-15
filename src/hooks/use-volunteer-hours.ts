import { useCallback, useEffect, useRef, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type VolunteerHourEntry = {
  id: number;
  opportunityId: number;
  opportunityTitle?: string | null;
  date: string;
  hours: number;
  notes?: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
};

export type LogHoursInput = {
  opportunityId: number;
  date: string;
  hours: number;
  notes?: string;
};

export function useVolunteerHours(): {
  hours: VolunteerHourEntry[];
  loading: boolean;
  isMutating: boolean;
  error: string | null;
  logHours: (input: LogHoursInput) => Promise<VolunteerHourEntry | null>;
  deleteHours: (hoursId: number) => Promise<boolean>;
} {
  const [hours, setHours] = useState<VolunteerHourEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMutating, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);
  const handleApiErrorRef = useRef(handleApiError);
  handleApiErrorRef.current = handleApiError;
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const result = await apiClient.get<{ data: VolunteerHourEntry[] }>(
          "/api/volunteer/hours",
        );
        if (!cancelled) setHours(result.data);
      } catch (error_) {
        if (cancelled) return;
        handleApiErrorRef.current(error_, "Failed to load hours");
        setHours([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return (): void => {
      cancelled = true;
    };
  }, [refreshKey]);

  const logHours = useCallback(
    async (input: LogHoursInput): Promise<VolunteerHourEntry | null> => {
      setSubmitting(true);
      setError(null);
      try {
        const result = await apiClient.post<{ data: VolunteerHourEntry }>(
          "/api/volunteer/hours",
          input,
        );
        setRefreshKey((k) => k + 1);
        return result.data;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to log hours")) {
          console.error("[useVolunteerHours] logHours:", error_);
        }
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [handleApiError],
  );

  const deleteHours = useCallback(
    async (hoursId: number): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await apiClient.delete<void>(`/api/volunteer/hours/${hoursId}`);
        setRefreshKey((k) => k + 1);
        return true;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to delete hours")) {
          console.error("[useVolunteerHours] deleteHours:", error_);
        }
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [handleApiError],
  );

  return { hours, loading, isMutating, error, logHours, deleteHours };
}
