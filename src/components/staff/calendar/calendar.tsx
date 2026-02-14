"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useRef, useState } from "react";

type CalendarEvent = {
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

type EventFormData = {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  maxVolunteers: string;
};

const initialFormData: EventFormData = {
  title: "",
  description: "",
  location: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  maxVolunteers: "",
};

type CalendarProps = {
  readOnly?: boolean;
};

/**
 * Calendar Component
 *
 * Full-featured calendar with FullCalendar library supporting:
 * - Month, week, and day views
 * - Event creation, editing, and deletion (when not read-only)
 * - Drag and drop to reschedule events (when not read-only)
 * - All events persisted in database
 */
export default function Calendar({
  readOnly = false,
}: CalendarProps): JSX.Element {
  const theme = useTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<
    "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  >("dayGridMonth");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const calendarRef = useRef<FullCalendar | null>(null);

  // Fetch events from API
  const fetchEvents = useCallback(async (start?: Date, end?: Date) => {
    try {
      const params = new URLSearchParams();
      if (start) params.append("start", start.toISOString());
      if (end) params.append("end", end.toISOString());

      const response = await fetch(
        `/api/staff/calendar/events?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const result = await response.json();
      setEvents(result.data || []);
    } catch (error) {
      enqueueSnackbar("Failed to load events", { variant: "error" });
      console.error("Error fetching events:", error);
    }
  }, []);

  // Helper function to get date range for fetching events
  const getEventsFetchDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth() + 2, 0),
    };
  };

  // Helper function to validate event date/time range
  const validateEventDateTime = (
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
  ): boolean => {
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      enqueueSnackbar("End date/time must be after start date/time", {
        variant: "error",
      });
      return false;
    }

    return true;
  };

  // Load events on mount and when view changes
  useEffect(() => {
    const { start, end } = getEventsFetchDateRange();
    void fetchEvents(start, end);
  }, [fetchEvents]);

  // Handle date selection (create new event)
  const handleDateSelect = (selectInfo: { start: Date; end?: Date }): void => {
    const startDate = new Date(selectInfo.start);
    const endDate = selectInfo.end
      ? new Date(selectInfo.end)
      : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

    setFormData({
      ...initialFormData,
      startDate: startDate.toISOString().split("T")[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endDate: endDate.toISOString().split("T")[0],
      endTime: endDate.toTimeString().slice(0, 5),
    });
    setIsCreateModalOpen(true);
  };

  // Handle event click (view/edit/delete)
  const handleEventClick = (clickInfo: { event: { id: string } }): void => {
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);

      if (readOnly) {
        // In readonly mode, just show the view modal
        setIsViewModalOpen(true);
      } else {
        // In edit mode, open edit modal and populate form
        setIsEditModalOpen(true);

        // Populate form with event data
        const start = new Date(event.start);
        const end = new Date(event.end);
        setFormData({
          title: event.title,
          description: event.description || "",
          location: event.location || "",
          startDate: start.toISOString().split("T")[0],
          startTime: start.toTimeString().slice(0, 5),
          endDate: end.toISOString().split("T")[0],
          endTime: end.toTimeString().slice(0, 5),
          maxVolunteers: event.extendedProps?.maxVolunteers?.toString() || "",
        });
      }
    }
  };

  // Handle event drop (drag and drop reschedule)
  // Use an inline type for dropInfo to fix missing type import
  const handleEventDrop = async (dropInfo: {
    event: {
      id: string;
      start: Date | null;
      end: Date | null;
      // Optionally include revert if present on event object, otherwise available on dropInfo
    };
    revert: () => void;
  }): Promise<void> => {
    const eventId = dropInfo.event.id;
    const newStart = dropInfo.event.start;

    // Fallback: if end is missing, default to 1 hour after start
    const newEnd =
      dropInfo.event.end && newStart
        ? dropInfo.event.end
        : newStart
          ? new Date(newStart.getTime() + 60 * 60 * 1000)
          : null;

    if (!newStart || !newEnd) return;

    try {
      const response = await fetch(`/api/staff/calendar/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      // Refresh events
      const { start, end } = getEventsFetchDateRange();
      await fetchEvents(start, end);

      enqueueSnackbar("Event rescheduled successfully", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to reschedule event", { variant: "error" });
      console.error("Error updating event:", error);
      // Revert the change
      dropInfo.revert();
    }
  };

  // Handle create event
  const handleCreateEvent = async (): Promise<void> => {
    if (!formData.title.trim()) {
      enqueueSnackbar("Title is required", { variant: "error" });
      return;
    }

    try {
      if (
        !validateEventDateTime(
          formData.startDate,
          formData.startTime,
          formData.endDate,
          formData.endTime,
        )
      ) {
        return;
      }

      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`,
      );
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const response = await fetch("/api/staff/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          location: formData.location || undefined,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          maxVolunteers: formData.maxVolunteers
            ? Number.parseInt(formData.maxVolunteers, 10)
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create event");
      }

      enqueueSnackbar("Event created successfully", { variant: "success" });
      setIsCreateModalOpen(false);
      setFormData(initialFormData);

      // Refresh events
      const { start, end } = getEventsFetchDateRange();
      await fetchEvents(start, end);
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to create event",
        { variant: "error" },
      );
      console.error("Error creating event:", error);
    }
  };

  // Handle update event
  const handleUpdateEvent = async (): Promise<void> => {
    if (!selectedEvent || !formData.title.trim()) {
      enqueueSnackbar("Title is required", { variant: "error" });
      return;
    }

    try {
      if (
        !validateEventDateTime(
          formData.startDate,
          formData.startTime,
          formData.endDate,
          formData.endTime,
        )
      ) {
        return;
      }

      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`,
      );
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const response = await fetch(
        `/api/staff/calendar/events/${selectedEvent.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description || undefined,
            location: formData.location || undefined,
            startDate: startDateTime.toISOString(),
            endDate: endDateTime.toISOString(),
            maxVolunteers: formData.maxVolunteers
              ? Number.parseInt(formData.maxVolunteers, 10)
              : undefined,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update event");
      }

      enqueueSnackbar("Event updated successfully", { variant: "success" });
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      setFormData(initialFormData);

      // Refresh events
      const { start, end } = getEventsFetchDateRange();
      await fetchEvents(start, end);
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to update event",
        { variant: "error" },
      );
      console.error("Error updating event:", error);
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (): Promise<void> => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(
        `/api/staff/calendar/events/${selectedEvent.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      enqueueSnackbar("Event deleted successfully", { variant: "success" });
      setIsDeleteDialogOpen(false);
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      setFormData(initialFormData);

      // Refresh events
      const { start, end } = getEventsFetchDateRange();
      await fetchEvents(start, end);
    } catch (error) {
      enqueueSnackbar("Failed to delete event", { variant: "error" });
      console.error("Error deleting event:", error);
    }
  };

  // Close modals and reset state
  const handleCloseCreateModal = (): void => {
    setIsCreateModalOpen(false);
    setFormData(initialFormData);
  };

  const handleCloseEditModal = (): void => {
    setIsEditModalOpen(false);
    setSelectedEvent(null);
    setFormData(initialFormData);
  };

  const handleOpenDeleteDialog = (): void => {
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = (): void => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 4 },
      }}
    >
      {/* Header with View Switcher */}
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
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Event Calendar
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
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
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: 2,
              },
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
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: 2,
              },
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
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: 2,
              },
            }}
          >
            Day
          </Button>
        </Box>
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
          "& .fc": {
            fontFamily: "inherit",
          },
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
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
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
          "& .fc-scrollgrid": {
            border: "none",
            borderRadius: 2,
          },
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
          "& .fc-daygrid-event": {
            marginBottom: "3px",
          },
          "& .fc-timegrid-event": {
            borderRadius: 1.5,
          },
          "& .fc-daygrid-day-top": {
            flexDirection: "row",
          },
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
            // Sync view state when calendar view changes
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

      {/* Create Event Modal */}
      {!readOnly && (
        <Dialog
          open={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: `0 8px 32px ${theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.12)"}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              fontSize: "1.5rem",
              pb: 1,
            }}
          >
            Create New Event
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
            >
              <TextField
                label="Title"
                required
                fullWidth
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                label="Location"
                fullWidth
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  required
                  fullWidth
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  label="Start Time"
                  type="time"
                  required
                  fullWidth
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="End Date"
                  type="date"
                  required
                  fullWidth
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  label="End Time"
                  type="time"
                  required
                  fullWidth
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
              <TextField
                label="Max Volunteers"
                type="number"
                fullWidth
                value={formData.maxVolunteers}
                onChange={(e) =>
                  setFormData({ ...formData, maxVolunteers: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
            <Button
              onClick={handleCloseCreateModal}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEvent}
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Event Modal */}
      {!readOnly && (
        <Dialog
          open={isEditModalOpen}
          onClose={handleCloseEditModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: `0 8px 32px ${theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.12)"}`,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: "1.5rem",
                }}
              >
                Edit Event
              </Typography>
              <IconButton
                onClick={handleOpenDeleteDialog}
                color="error"
                aria-label="delete event"
                sx={{
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.1)",
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? `${theme.palette.error.main}20`
                        : `${theme.palette.error.main}14`,
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
            >
              <TextField
                label="Title"
                required
                fullWidth
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <TextField
                label="Location"
                fullWidth
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  required
                  fullWidth
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  label="Start Time"
                  type="time"
                  required
                  fullWidth
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="End Date"
                  type="date"
                  required
                  fullWidth
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  label="End Time"
                  type="time"
                  required
                  fullWidth
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
              <TextField
                label="Max Volunteers"
                type="number"
                fullWidth
                value={formData.maxVolunteers}
                onChange={(e) =>
                  setFormData({ ...formData, maxVolunteers: e.target.value })
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
            <Button
              onClick={handleCloseEditModal}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateEvent}
              variant="contained"
              startIcon={<EditIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {!readOnly && (
        <Dialog
          open={isDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: `0 8px 32px ${theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.12)"}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              fontSize: "1.5rem",
              pb: 1,
            }}
          >
            Delete Event
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: "1rem", lineHeight: 1.6 }}>
              Are you sure you want to delete &quot;{selectedEvent?.title}
              &quot;? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
            <Button
              onClick={handleCloseDeleteDialog}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteEvent}
              color="error"
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* View Event Modal (Readonly) */}
      <Dialog
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.5rem",
            pb: 1,
          }}
        >
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
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button
            onClick={() => setIsViewModalOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
