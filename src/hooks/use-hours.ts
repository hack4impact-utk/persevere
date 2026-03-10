import { useCallback, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type VolunteerHour = {
  id: number;
  volunteerId: number;
  opportunityId: number;
  opportunityTitle?: string;
  date: string;
  hours: number;
  notes?: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  verifiedBy?: number | null;
  verifiedAt?: string | null;
};

export function useHours(): {
  approveHours: (hoursId: number) => Promise<VolunteerHour | null>;
  rejectHours: (
    hoursId: number,
    reason?: string,
  ) => Promise<VolunteerHour | null>;
  deleteHours: (hoursId: number) => Promise<boolean>;
  loading: boolean;
  error: string | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const approveHours = useCallback(
    async (hoursId: number): Promise<VolunteerHour | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.put<{ data: VolunteerHour }>(
          `/api/staff/hours/${hoursId}`,
          { action: "approve" },
        );
        return result.data;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to approve hours")) {
          console.error("[useHours] approveHours:", error_);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  const rejectHours = useCallback(
    async (hoursId: number, reason?: string): Promise<VolunteerHour | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.put<{ data: VolunteerHour }>(
          `/api/staff/hours/${hoursId}`,
          { action: "reject", reason },
        );
        return result.data;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to reject hours")) {
          console.error("[useHours] rejectHours:", error_);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  const deleteHours = useCallback(
    async (hoursId: number): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await apiClient.delete<{ success: boolean }>(
          `/api/staff/hours/${hoursId}`,
        );
        return true;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to delete hours")) {
          console.error("[useHours] deleteHours:", error_);
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  return { approveHours, rejectHours, deleteHours, loading, error };
}
