"use client";

import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ListIcon from "@mui/icons-material/List";
import {
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useState } from "react";

import { Calendar } from "@/components/staff/calendar";
import EventDetailModal from "@/components/staff/calendar/event-detail-modal";
import EventFormModal from "@/components/staff/calendar/event-form-modal";
import EventList from "@/components/staff/calendar/event-list";
import { useCalendarEvents } from "@/hooks/use-calendar-events";

type View = "list" | "calendar";

type InitialDates = {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

/** Opportunities page — list and calendar views for managing volunteer events. */
export default function StaffOpportunitiesPage(): JSX.Element {
  const [view, setView] = useState<View>("list");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [initialDates, setInitialDates] = useState<InitialDates | undefined>();

  const { events, fetchEvents } = useCalendarEvents();

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
        gap: 3,
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 4 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          Opportunities
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView: View | null) => {
              if (newView) setView(newView);
            }}
            size="small"
            aria-label="view toggle"
          >
            <ToggleButton value="list" aria-label="list view">
              <ListIcon fontSize="small" sx={{ mr: 0.5 }} />
              List
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="calendar view">
              <CalendarMonthIcon fontSize="small" sx={{ mr: 0.5 }} />
              Calendar
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setInitialDates(undefined);
              setIsCreateModalOpen(true);
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Add Event
          </Button>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {view === "list" ? (
          <EventList
            events={events}
            onEventClick={(id) => {
              setSelectedEventId(id);
            }}
          />
        ) : (
          <Calendar
            onEventClick={(id) => {
              setSelectedEventId(id);
            }}
            onDateSelect={handleDateSelect}
          />
        )}
      </Box>

      {/* Modals */}
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
