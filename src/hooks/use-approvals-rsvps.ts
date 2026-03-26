import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type PendingRsvp = {
  volunteerId: number;
  volunteerName: string;
  opportunityId: number;
  opportunityTitle: string;
  opportunityStartDate: string;
  rsvpAt: string;
};

export function useApprovalsRsvps(): {
  rsvps: PendingRsvp[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  confirmRsvp: (volunteerId: number, opportunityId: number) => Promise<boolean>;
  declineRsvp: (volunteerId: number, opportunityId: number) => Promise<boolean>;
  mutating: boolean;
} {
  const [rsvps, setRsvps] = useState<PendingRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const handleApiError = useApiErrorHandler(setError);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<{ data: PendingRsvp[] }>("/api/staff/rsvps?status=pending")
      .then((res) => {
        if (!cancelled) setRsvps(res.data);
      })
      .catch((error_) => {
        if (!cancelled) handleApiError(error_, "Failed to load RSVPs");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return (): void => {
      cancelled = true;
    };
  }, [tick, handleApiError]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  const updateStatus = useCallback(
    async (
      volunteerId: number,
      opportunityId: number,
      status: "confirmed" | "declined",
    ): Promise<boolean> => {
      setMutating(true);
      try {
        await apiClient.put("/api/staff/rsvps", {
          volunteerId,
          opportunityId,
          status,
        });
        setRsvps((prev) =>
          prev.filter(
            (r) =>
              !(
                r.volunteerId === volunteerId &&
                r.opportunityId === opportunityId
              ),
          ),
        );
        return true;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to update RSVP")) {
          console.error("[useApprovalsRsvps] updateStatus:", error_);
        }
        return false;
      } finally {
        setMutating(false);
      }
    },
    [handleApiError],
  );

  const confirmRsvp = useCallback(
    (volunteerId: number, opportunityId: number) =>
      updateStatus(volunteerId, opportunityId, "confirmed"),
    [updateStatus],
  );

  const declineRsvp = useCallback(
    (volunteerId: number, opportunityId: number) =>
      updateStatus(volunteerId, opportunityId, "declined"),
    [updateStatus],
  );

  return { rsvps, loading, error, refetch, confirmRsvp, declineRsvp, mutating };
}
