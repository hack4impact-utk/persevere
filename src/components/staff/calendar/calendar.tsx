"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useRef, useState } from "react";

import {
  type CalendarEvent,
  useCalendarEvents,
} from "@/hooks/use-calendar-events";

type CalendarProps = {
  readOnly?: boolean;
  onEventClick?: (id: string) => void;
  onDateSelect?: (startDate: string, endDate: string) => void;
};

/**
 * Calendar Component
 *
 * Full-featured calendar with FullCalendar library supporting:
 * - Month, week, and day views
 * - Drag and drop to reschedule events (when not read-only)
 * - All events persisted in database
 *
 * In staff mode, event click/date select are delegated to parent via callbacks.
 * In readOnly mode (volunteer calendar), shows a built-in view modal on click.
 */
export default function Calendar({
  readOnly = false,
  onEventClick,
  onDateSelect,
}: CalendarProps): JSX.Element {
  const theme = useTheme();
  const { events, fetchEvents, updateEvent } = useCalendarEvents();
  const [view, setView] = useState<
    "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  >("dayGridMonth");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const calendarRef = useRef<FullCalendar | null>(null);

  // Wraps hook fetchEvents with error handling for snackbar
  const loadEvents = useCallback(
    async (start?: Date, end?: Date): Promise<void> => {
      try {
        await fetchEvents(start, end);
      } catch (error) {
        enqueueSnackbar("Failed to load events", { variant: "error" });
        console.error("Error fetching events:", error);
      }
    },
    [fetchEvents],
  );

  // Helper function to get date range for fetching events
  const getEventsFetchDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth() + 2, 0),
    };
  };

  // Load events on mount
  useEffect(() => {
    const { start, end } = getEventsFetchDateRange();
    void loadEvents(start, end);
  }, [loadEvents]);

  // Handle date selection
  const handleDateSelect = (selectInfo: { start: Date; end?: Date }): void => {
    if (onDateSelect) {
      const startDate = new Date(selectInfo.start);
      const endDate = selectInfo.end
        ? new Date(selectInfo.end)
        : new Date(startDate.getTime() + 60 * 60 * 1000);
      onDateSelect(startDate.toISOString(), endDate.toISOString());
    }
  };

  // Handle event click
  const handleEventClick = (clickInfo: { event: { id: string } }): void => {
    if (onEventClick) {
      onEventClick(clickInfo.event.id);
      return;
    }

    // readOnly mode: show built-in view modal
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsViewModalOpen(true);
    }
  };

  // Handle event drop (drag and drop reschedule)
  const handleEventDrop = async (dropInfo: {
    event: {
      id: string;
      start: Date | null;
      end: Date | null;
    };
    revert: () => void;
  }): Promise<void> => {
    const eventId = dropInfo.event.id;
    const newStart = dropInfo.event.start;

    const newEnd =
      dropInfo.event.end && newStart
        ? dropInfo.event.end
        : newStart
          ? new Date(newStart.getTime() + 60 * 60 * 1000)
          : null;

    if (!newStart || !newEnd) return;

    try {
      await updateEvent(eventId, {
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      });

      const { start, end } = getEventsFetchDateRange();
      await loadEvents(start, end);

      enqueueSnackbar("Event rescheduled successfully", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to reschedule event", { variant: "error" });
      console.error("Error updating event:", error);
      dropInfo.revert();
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* View Switcher */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button
          variant={view === "dayGridMonth" ? "contained" : "outlined"}
          onClick={() => {
            setView("dayGridMonth");
            calendarRef.current?.getApi().changeView("dayGridMonth");
          }}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          Month
        </Button>
        <Button
          variant={view === "timeGridWeek" ? "contained" : "outlined"}
          onClick={() => {
            setView("timeGridWeek");
            calendarRef.current?.getApi().changeView("timeGridWeek");
          }}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          Week
        </Button>
        <Button
          variant={view === "timeGridDay" ? "contained" : "outlined"}
          onClick={() => {
            setView("timeGridDay");
            calendarRef.current?.getApi().changeView("timeGridDay");
          }}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          Day
        </Button>
      </Box>

      {/* FullCalendar */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          backgroundColor: "background.paper",
          borderRadius: 3,
          boxShadow: `0 4px 20px ${theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.08)"}`,
          p: { xs: 2, md: 3 },
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          "& .fc": { fontFamily: "inherit" },
          "& .fc-toolbar-title": {
            fontSize: { xs: "1.25rem", md: "1.75rem" },
            fontWeight: 700,
            letterSpacing: "-0.02em",
          },
          "& .fc-button": {
            backgroundColor: theme.palette.primary.main,
            border: "none",
            borderRadius: 2,
            textTransform: "capitalize",
            fontWeight: 600,
            padding: "8px 16px",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              backgroundColor:
                theme.palette.primary.dark || theme.palette.action.hover,
              transform: "translateY(-1px)",
            },
            "&:disabled": {
              backgroundColor: theme.palette.action.disabledBackground,
              opacity: 0.6,
            },
            "&:focus": {
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
            },
          },
          "& .fc-button-active": {
            backgroundColor: `${theme.palette.primary.main} !important`,
            fontWeight: 700,
          },
          "& .fc-daygrid-day": {
            transition: "background-color 0.2s ease",
            "&:hover": { backgroundColor: theme.palette.action.hover },
          },
          "& .fc-daygrid-day-number": {
            fontSize: "0.95rem",
            fontWeight: 600,
            padding: "8px",
          },
          "& .fc-col-header-cell": {
            backgroundColor: theme.palette.action.hover,
            borderColor: "divider",
            padding: "12px 4px",
            fontWeight: 700,
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
          },
          "& .fc-scrollgrid": { border: "none", borderRadius: 2 },
          "& .fc-theme-standard td, & .fc-theme-standard th": {
            borderColor: theme.palette.divider,
          },
          "& .fc-event": {
            border: "none",
            borderRadius: 1.5,
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            backgroundColor: theme.palette.primary.main,
            color:
              theme.palette.primary.contrastText || theme.palette.common.white,
            transition: "all 0.2s ease-in-out",
            boxShadow: `0 2px 4px ${theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)"}`,
            "&:hover": {
              backgroundColor:
                theme.palette.primary.dark || theme.palette.action.hover,
              transform: "translateY(-1px)",
              boxShadow: `0 4px 12px ${theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.15)"}`,
            },
          },
          "& .fc-event-title": {
            color:
              theme.palette.primary.contrastText || theme.palette.common.white,
          },
          "& .fc-event-title-container": {
            color:
              theme.palette.primary.contrastText || theme.palette.common.white,
          },
          "& .fc-daygrid-event": { marginBottom: "3px" },
          "& .fc-timegrid-event": { borderRadius: 1.5 },
          "& .fc-daygrid-day-top": { flexDirection: "row" },
          "& .fc-highlight": {
            backgroundColor: theme.palette.action.selected,
          },
          "& .fc-day-today": {
            backgroundColor: `${theme.palette.action.hover} !important`,
          },
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          editable={!readOnly}
          selectable={!readOnly}
          selectMirror={!readOnly}
          dayMaxEvents
          weekends
          events={events}
          select={readOnly ? undefined : handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={readOnly ? undefined : handleEventDrop}
          height="auto"
          aspectRatio={1.8}
          datesSet={(arg) => {
            const currentView = arg.view.type;
            if (
              currentView === "dayGridMonth" ||
              currentView === "timeGridWeek" ||
              currentView === "timeGridDay"
            ) {
              setView(currentView);
            }
          }}
        />
      </Box>

      {/* View Event Modal (readOnly volunteer calendar only) */}
      <Dialog
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)" },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.5rem", pb: 1 }}>
          {selectedEvent?.title}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
          >
            {selectedEvent?.description && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  Description
                </Typography>
                <Typography sx={{ fontSize: "1rem", lineHeight: 1.6 }}>
                  {selectedEvent.description}
                </Typography>
              </Box>
            )}
            {selectedEvent?.location && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  Location
                </Typography>
                <Typography sx={{ fontSize: "1rem", lineHeight: 1.6 }}>
                  {selectedEvent.location}
                </Typography>
              </Box>
            )}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
              >
                Start
              </Typography>
              <Typography sx={{ fontSize: "1rem", lineHeight: 1.6 }}>
                {selectedEvent?.start
                  ? new Date(selectedEvent.start).toLocaleString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : ""}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
              >
                End
              </Typography>
              <Typography sx={{ fontSize: "1rem", lineHeight: 1.6 }}>
                {selectedEvent?.end
                  ? new Date(selectedEvent.end).toLocaleString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : ""}
              </Typography>
            </Box>
            {selectedEvent?.extendedProps?.maxVolunteers && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  Max Volunteers
                </Typography>
                <Typography sx={{ fontSize: "1rem", lineHeight: 1.6 }}>
                  {selectedEvent.extendedProps.maxVolunteers}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => {
              setIsViewModalOpen(false);
            }}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              boxShadow: 2,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
