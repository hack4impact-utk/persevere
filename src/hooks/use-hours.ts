import { useState } from "react";

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
  verified: boolean;
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

  const logHours = async (
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
      setError(
        error_ instanceof Error ? error_.message : "Failed to log hours",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyHours = async (
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
      setError(
        error_ instanceof Error ? error_.message : "Failed to verify hours",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const editHours = async (
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
      setError(
        error_ instanceof Error ? error_.message : "Failed to edit hours",
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteHours = async (hoursId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete<{ success: boolean }>(
        `/api/staff/hours/${hoursId}`,
      );
      return true;
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : "Failed to delete hours",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { logHours, verifyHours, editHours, deleteHours, loading, error };
}
