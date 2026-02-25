import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { apiClient, AuthenticationError } from "@/lib/api-client";
import type { EventRsvp } from "@/services/event-rsvps.service";

export type UseEventRsvpsResult = {
  rsvps: EventRsvp[];
  isLoading: boolean;
  error: string | null;
  fetchRsvps: (eventId: string) => Promise<void>;
};

export function useEventRsvps(): UseEventRsvpsResult {
  const router = useRouter();
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRsvps = useCallback(
    async (eventId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await apiClient.get<{ data: EventRsvp[] }>(
          `/api/staff/calendar/events/${eventId}/rsvps`,
        );
        setRsvps(result.data ?? []);
      } catch (error_) {
        if (error_ instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        setError("Failed to load RSVPs.");
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  return { rsvps, isLoading, error, fetchRsvps };
}

export { type EventRsvp } from "@/services/event-rsvps.service";
