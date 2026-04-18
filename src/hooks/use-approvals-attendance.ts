import { useCallback, useEffect, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type AttendanceEvent = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: "open" | "full" | "completed" | "canceled";
  confirmedCount: number;
};

export type AttendanceRsvp = {
  volunteerId: number;
  firstName: string;
  lastName: string;
  rsvpStatus: string;
};

export function useApprovalsAttendance(): {
  events: AttendanceEvent[];
  loadingEvents: boolean;
  eventRsvps: AttendanceRsvp[];
  loadingRsvps: boolean;
  error: string | null;
  loadEventRsvps: (eventId: number) => Promise<void>;
  markAttendance: (
    volunteerId: number,
    opportunityId: number,
    status: "attended" | "no_show" | "confirmed" | "cancelled",
  ) => Promise<boolean>;
  mutating: boolean;
} {
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventRsvps, setEventRsvps] = useState<AttendanceRsvp[]>([]);
  const [loadingRsvps, setLoadingRsvps] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  useEffect(() => {
    let cancelled = false;
    setLoadingEvents(true);
    apiClient
      .get<{ data: AttendanceEvent[] }>("/api/staff/approvals/events")
      .then((res) => {
        if (!cancelled) setEvents(res.data);
      })
      .catch((error_) => {
        if (!cancelled) handleApiError(error_, "Failed to load events");
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false);
      });
    return (): void => {
      cancelled = true;
    };
  }, [handleApiError]);

  const loadEventRsvps = useCallback(
    async (eventId: number): Promise<void> => {
      setLoadingRsvps(true);
      setEventRsvps([]);
      try {
        const res = await apiClient.get<{ data: AttendanceRsvp[] }>(
          `/api/staff/calendar/events/${eventId}/rsvps`,
        );
        setEventRsvps(res.data);
      } catch (error_) {
        if (!handleApiError(error_, "Failed to load event RSVPs")) {
          console.error("[useApprovalsAttendance] loadEventRsvps:", error_);
        }
      } finally {
        setLoadingRsvps(false);
      }
    },
    [handleApiError],
  );

  const markAttendance = useCallback(
    async (
      volunteerId: number,
      opportunityId: number,
      status: "attended" | "no_show" | "confirmed" | "cancelled",
    ): Promise<boolean> => {
      setMutating(true);
      try {
        const prevRsvp = eventRsvps.find((r) => r.volunteerId === volunteerId);
        const wasConfirmed = prevRsvp?.rsvpStatus === "confirmed";
        const becomingConfirmed = status === "confirmed";

        await apiClient.put("/api/staff/rsvps", {
          volunteerId,
          opportunityId,
          status,
        });

        setEventRsvps((prev) =>
          prev.map((r) =>
            r.volunteerId === volunteerId ? { ...r, rsvpStatus: status } : r,
          ),
        );

        if (wasConfirmed && !becomingConfirmed) {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === opportunityId
                ? { ...e, confirmedCount: Math.max(0, e.confirmedCount - 1) }
                : e,
            ),
          );
        } else if (!wasConfirmed && becomingConfirmed) {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === opportunityId
                ? { ...e, confirmedCount: e.confirmedCount + 1 }
                : e,
            ),
          );
        }

        return true;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to mark attendance")) {
          console.error("[useApprovalsAttendance] markAttendance:", error_);
        }
        return false;
      } finally {
        setMutating(false);
      }
    },
    [handleApiError, eventRsvps],
  );

  return {
    events,
    loadingEvents,
    eventRsvps,
    loadingRsvps,
    error,
    loadEventRsvps,
    markAttendance,
    mutating,
  };
}
