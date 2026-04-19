"use client";

import { Box, CircularProgress } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useState } from "react";

import EventDetailModal from "@/components/staff/calendar/event-detail-modal";
import EventList from "@/components/staff/calendar/event-list";
import { useCalendarEvents } from "@/hooks/use-calendar-events";

export default function StaffOpportunitiesPage(): JSX.Element {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { events, loading, fetchEvents } = useCalendarEvents();

  const loadEvents = useCallback(async (): Promise<void> => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      await fetchEvents(start, end);
    } catch {
      enqueueSnackbar("Failed to load events", { variant: "error" });
    }
  }, [fetchEvents]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 3 }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <EventList
            events={events}
            onEventClick={(id) => {
              setSelectedEventId(id);
            }}
          />
        )}
      </Box>

      <EventDetailModal
        event={
          selectedEventId
            ? (events.find((e) => e.id === selectedEventId) ?? null)
            : null
        }
        eventId={selectedEventId}
        open={!!selectedEventId}
        onClose={() => {
          setSelectedEventId(null);
        }}
        onUpdated={() => {
          void loadEvents();
        }}
        onDeleted={() => {
          void loadEvents();
        }}
      />
    </Box>
  );
}
