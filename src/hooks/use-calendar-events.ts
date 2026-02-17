import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { apiClient, AuthenticationError } from "@/lib/api-client";

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  extendedProps?: {
    maxVolunteers?: number | null;
    status?: string;
    createdById?: number;
    isRecurring?: boolean;
    recurrencePattern?: unknown;
  };
};

type CreateEventData = {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  maxVolunteers?: number;
};

type UpdateEventData = Partial<CreateEventData>;

export type UseCalendarEventsResult = {
  events: CalendarEvent[];
  isLoading: boolean;
  fetchEvents: (startDate?: Date, endDate?: Date) => Promise<void>;
  createEvent: (data: CreateEventData) => Promise<void>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
};

export function useCalendarEvents(): UseCalendarEventsResult {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = useCallback(
    async (startDate?: Date, endDate?: Date): Promise<void> => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start", startDate.toISOString());
        if (endDate) params.append("end", endDate.toISOString());

        const result = await apiClient.get<{ data: CalendarEvent[] }>(
          `/api/staff/calendar/events?${params.toString()}`,
        );
        setEvents(result.data ?? []);
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

  const createEvent = useCallback(
    async (data: CreateEventData): Promise<void> => {
      try {
        await apiClient.post("/api/staff/calendar/events", data);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        throw error;
      }
    },
    [router],
  );

  const updateEvent = useCallback(
    async (id: string, data: UpdateEventData): Promise<void> => {
      try {
        await apiClient.put(`/api/staff/calendar/events/${id}`, data);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        throw error;
      }
    },
    [router],
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<void> => {
      try {
        await apiClient.delete(`/api/staff/calendar/events/${id}`);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        throw error;
      }
    },
    [router],
  );

  return {
    events,
    isLoading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
