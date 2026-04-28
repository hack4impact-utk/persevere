"use client";

import { Box, Button, CircularProgress } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Calendar } from "@/components/staff/calendar";
import EventDetailModal from "@/components/staff/calendar/event-detail-modal";
import EventFormModal from "@/components/staff/calendar/event-form-modal";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { usePortalLabel } from "@/hooks/use-portal-label";

type InitialDates = {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

export default function StaffCalendarPage(): JSX.Element {
  const portalLabel = usePortalLabel();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [initialDates, setInitialDates] = useState<InitialDates | undefined>();

  const { events, loading, fetchEvents, updateEvent } = useCalendarEvents();

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

  const handleEventDrop = useCallback(
    async (id: string, newStart: Date, newEnd: Date): Promise<void> => {
      await updateEvent(id, {
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      });
      await loadEvents();
    },
    [updateEvent, loadEvents],
  );

  const handleDateSelect = (startIso: string, endIso: string): void => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    setInitialDates({
      startDate: start.toISOString().split("T")[0],
      startTime: start.toTimeString().slice(0, 5),
      endDate: end.toISOString().split("T")[0],
      endTime: end.toTimeString().slice(0, 5),
    });
    setIsCreateModalOpen(true);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 2,
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: { xs: 2, md: 4 },
      }}
    >
      <PageHeader
        eyebrow={portalLabel}
        title="Calendar"
        actions={
          <Button
            variant="contained"
            onClick={() => {
              setInitialDates(undefined);
              setIsCreateModalOpen(true);
            }}
          >
            New event
          </Button>
        }
      />

      <Box sx={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Calendar
            events={events}
            onEventClick={(id) => {
              setSelectedEventId(id);
            }}
            onDateSelect={handleDateSelect}
            onEventDrop={handleEventDrop}
          />
        )}
      </Box>

      <EventFormModal
        open={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
        onCreated={() => {
          void loadEvents();
        }}
        initialDates={initialDates}
      />
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
