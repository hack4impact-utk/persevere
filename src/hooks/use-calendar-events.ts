import { useCallback, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  extendedProps?: {
    maxVolunteers?: number | null;
    rsvpCount?: number;
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
  loading: boolean;
  isMutating: boolean;
  error: string | null;
  fetchEvents: (startDate?: Date, endDate?: Date) => Promise<void>;
  createEvent: (data: CreateEventData) => Promise<CalendarEvent[]>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
};

export function useCalendarEvents(): UseCalendarEventsResult {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const fetchEvents = useCallback(
    async (startDate?: Date, endDate?: Date): Promise<void> => {
      setLoading(true);
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
        handleApiError(error_, "Failed to load calendar events.");
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
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
        if (handleApiError(error_)) return [];
        throw error_;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError],
  );

  const updateEvent = useCallback(
    async (id: string, data: UpdateEventData): Promise<void> => {
      setIsMutating(true);
      try {
        await apiClient.put(`/api/staff/calendar/events/${id}`, data);
      } catch (error_) {
        if (handleApiError(error_)) return;
        throw error_;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError],
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<void> => {
      setIsMutating(true);
      try {
        await apiClient.delete(`/api/staff/calendar/events/${id}`);
      } catch (error_) {
        if (handleApiError(error_)) return;
        throw error_;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError],
  );

  return {
    events,
    loading,
    isMutating,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
