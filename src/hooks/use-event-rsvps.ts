import { useCallback, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import type { EventRsvp } from "@/services/event-rsvps.service";

export type UseEventRsvpsResult = {
  rsvps: EventRsvp[];
  loading: boolean;
  error: string | null;
  fetchRsvps: (eventId: string) => Promise<void>;
};

export function useEventRsvps(): UseEventRsvpsResult {
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchRsvps = useCallback(
    async (eventId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.get<{ data: EventRsvp[] }>(
          `/api/staff/calendar/events/${eventId}/rsvps`,
        );
        setRsvps(result.data ?? []);
      } catch (error_) {
        handleApiError(error_, "Failed to load RSVPs.");
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  return { rsvps, loading, error, fetchRsvps };
}

export { type EventRsvp } from "@/services/event-rsvps.service";
