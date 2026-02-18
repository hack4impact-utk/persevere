import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { apiClient, AuthenticationError } from "@/lib/api-client";
import type { EventRsvp } from "@/services/event-rsvps.service";

export type UseEventRsvpsResult = {
  rsvps: EventRsvp[];
  isLoading: boolean;
  fetchRsvps: (eventId: string) => Promise<void>;
};

export function useEventRsvps(): UseEventRsvpsResult {
  const router = useRouter();
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRsvps = useCallback(
    async (eventId: string): Promise<void> => {
      setIsLoading(true);
      try {
        const result = await apiClient.get<{ data: EventRsvp[] }>(
          `/api/staff/calendar/events/${eventId}/rsvps`,
        );
        setRsvps(result.data ?? []);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  return { rsvps, isLoading, fetchRsvps };
}

export { type EventRsvp } from "@/services/event-rsvps.service";
