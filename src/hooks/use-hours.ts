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
  verifiedBy?: number | null;
  verifiedAt?: string | null;
};

export type LogHoursPayload = {
  opportunityId: number;
  date: string;
  hours: number;
  notes?: string;
};

export type VerifyHoursPayload = {
  verify: boolean;
};

export function useHours(): {
  logHours: (
    volunteerId: number,
    payload: LogHoursPayload,
  ) => Promise<VolunteerHour | null>;
  verifyHours: (
    hoursId: number,
    payload: VerifyHoursPayload,
  ) => Promise<VolunteerHour | null>;
  editHours: (
    hoursId: number,
    payload: Partial<LogHoursPayload>,
  ) => Promise<VolunteerHour | null>;
  deleteHours: (hoursId: number) => Promise<boolean>;
  loading: boolean;
  error: string | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const logHours = useCallback(
    async (
      volunteerId: number,
      payload: LogHoursPayload,
    ): Promise<VolunteerHour | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.post<VolunteerHour>(
          `/api/staff/volunteers/${volunteerId}/hours`,
          payload,
        );
        return result;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to log hours")) {
          console.error("[useHours] logHours:", error_);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  const verifyHours = useCallback(
    async (
      hoursId: number,
      payload: VerifyHoursPayload,
    ): Promise<VolunteerHour | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.put<VolunteerHour>(
          `/api/staff/hours/${hoursId}`,
          payload,
        );
        return result;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to verify hours")) {
          console.error("[useHours] verifyHours:", error_);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  const editHours = useCallback(
    async (
      hoursId: number,
      payload: Partial<LogHoursPayload>,
    ): Promise<VolunteerHour | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.put<VolunteerHour>(
          `/api/staff/hours/${hoursId}`,
          payload,
        );
        return result;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to edit hours")) {
          console.error("[useHours] editHours:", error_);
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

  return { logHours, verifyHours, editHours, deleteHours, loading, error };
}
