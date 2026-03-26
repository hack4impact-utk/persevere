import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type ApprovalsHoursRecord = {
  id: number;
  volunteerId: number;
  volunteerName: string;
  opportunityId: number;
  opportunityTitle: string | null;
  date: string;
  hours: number;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
};

export type LogHoursInput = {
  volunteerId: number;
  opportunityId: number;
  date: string;
  hours: number;
  notes?: string;
};

export function useApprovalsHours(): {
  hours: ApprovalsHoursRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  approveHour: (id: number) => Promise<boolean>;
  rejectHour: (id: number, reason?: string) => Promise<boolean>;
  logHour: (input: LogHoursInput) => Promise<boolean>;
  mutating: boolean;
} {
  const [hours, setHours] = useState<ApprovalsHoursRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const handleApiError = useApiErrorHandler(setError);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<{ data: ApprovalsHoursRecord[] }>("/api/staff/hours?status=pending")
      .then((res) => {
        if (!cancelled) setHours(res.data);
      })
      .catch((error_) => {
        if (!cancelled) handleApiError(error_, "Failed to load hours");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return (): void => {
      cancelled = true;
    };
  }, [tick, handleApiError]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  const approveHour = useCallback(
    async (id: number): Promise<boolean> => {
      setMutating(true);
      try {
        await apiClient.put(`/api/staff/hours/${id}`, { action: "approve" });
        setHours((prev) => prev.filter((h) => h.id !== id));
        return true;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to approve hours")) {
          console.error("[useApprovalsHours] approveHour:", error_);
        }
        return false;
      } finally {
        setMutating(false);
      }
    },
    [handleApiError],
  );

  const rejectHour = useCallback(
    async (id: number, reason?: string): Promise<boolean> => {
      setMutating(true);
      try {
        await apiClient.put(`/api/staff/hours/${id}`, {
          action: "reject",
          reason,
        });
        setHours((prev) => prev.filter((h) => h.id !== id));
        return true;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to reject hours")) {
          console.error("[useApprovalsHours] rejectHour:", error_);
        }
        return false;
      } finally {
        setMutating(false);
      }
    },
    [handleApiError],
  );

  const logHour = useCallback(
    async (input: LogHoursInput): Promise<boolean> => {
      setMutating(true);
      try {
        await apiClient.post("/api/staff/hours", input);
        return true;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to log hours")) {
          console.error("[useApprovalsHours] logHour:", error_);
        }
        return false;
      } finally {
        setMutating(false);
      }
    },
    [handleApiError],
  );

  return {
    hours,
    loading,
    error,
    refetch,
    approveHour,
    rejectHour,
    logHour,
    mutating,
  };
}
