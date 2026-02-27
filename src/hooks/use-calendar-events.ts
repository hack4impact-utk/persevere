import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  apiClient,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/api-client";

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

type RecurrencePattern = {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  endDate?: string;
  count?: number;
};

type CreateEventData = {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  maxVolunteers?: number;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
};

type UpdateEventData = Partial<CreateEventData>;

export type UseCalendarEventsResult = {
  events: CalendarEvent[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  fetchEvents: (startDate?: Date, endDate?: Date) => Promise<void>;
  createEvent: (data: CreateEventData) => Promise<CalendarEvent[]>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
};

export function useCalendarEvents(): UseCalendarEventsResult {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(
    async (startDate?: Date, endDate?: Date): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append("start", startDate.toISOString());
        if (endDate) params.append("end", endDate.toISOString());

        const result = await apiClient.get<{ data: CalendarEvent[] }>(
          `/api/staff/calendar/events?${params.toString()}`,
        );
        setEvents(result.data ?? []);
      } catch (error_) {
        if (error_ instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        if (error_ instanceof AuthorizationError) {
          setError("Access denied");
          return;
        }
        console.error("[useCalendarEvents] fetch failed:", error_);
        setError("Failed to load calendar events.");
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const createEvent = useCallback(
    async (data: CreateEventData): Promise<CalendarEvent[]> => {
      setIsMutating(true);
      try {
        const result = await apiClient.post<{ data: CalendarEvent[] }>(
          "/api/staff/calendar/events",
          data,
        );
        return result.data;
      } catch (error_) {
        if (error_ instanceof AuthenticationError) {
          router.push("/auth/login");
          return [];
        }
        if (error_ instanceof AuthorizationError) {
          setError("Access denied");
          return [];
        }
        throw error_;
      } finally {
        setIsMutating(false);
      }
    },
    [router],
  );

  const updateEvent = useCallback(
    async (id: string, data: UpdateEventData): Promise<void> => {
      setIsMutating(true);
      try {
        await apiClient.put(`/api/staff/calendar/events/${id}`, data);
      } catch (error_) {
        if (error_ instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        if (error_ instanceof AuthorizationError) {
          setError("Access denied");
          return;
        }
        throw error_;
      } finally {
        setIsMutating(false);
      }
    },
    [router],
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<void> => {
      setIsMutating(true);
      try {
        await apiClient.delete(`/api/staff/calendar/events/${id}`);
      } catch (error_) {
        if (error_ instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        if (error_ instanceof AuthorizationError) {
          setError("Access denied");
          return;
        }
        throw error_;
      } finally {
        setIsMutating(false);
      }
    },
    [router],
  );

  return {
    events,
    isLoading,
    isMutating,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
