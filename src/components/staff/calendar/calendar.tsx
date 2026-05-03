"use client";

import type { DatesSetArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { SelectChangeEvent } from "@mui/material";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Typography,
  useTheme,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { JSX, useMemo, useRef, useState } from "react";

import type { CalendarEvent } from "@/hooks/use-calendar-events";

type ViewName = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

type CalendarProps = {
  events: CalendarEvent[];
  onEventClick?: (id: string) => void;
  onDateSelect?: (startDate: string, endDate: string) => void;
  onEventDrop?: (id: string, newStart: Date, newEnd: Date) => Promise<void>;
  readOnly?: boolean;
  eventColors?: Record<string, string>;
  compact?: boolean;
};

export default function Calendar({
  events,
  readOnly = false,
  onEventClick,
  onDateSelect,
  onEventDrop,
  eventColors,
  compact = false,
}: CalendarProps): JSX.Element {
  const theme = useTheme();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Custom toolbar state (staff full-view only)
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<ViewName>("dayGridMonth");
  const [currentTitle, setCurrentTitle] = useState<string>(
    new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Category color palette — keyed by lowercase category name
  const CATEGORY_COLORS: Record<string, string> = {
    workshop: "#327bf7",
    coaching: "#7b1fa2",
    event: "#0288d1",
    interview: "#d81b60",
    training: "#388e3c",
    mentoring: "#f57c00",
    social: "#455a64",
  };

  const getEventColor = (categoryName: string | null | undefined): string => {
    if (!categoryName) return theme.palette.primary.main;
    return (
      CATEGORY_COLORS[categoryName.toLowerCase()] ?? theme.palette.primary.main
    );
  };

  // Derive unique categories from loaded events (avoids extra API call)
  const uniqueCategories = useMemo(() => {
    const seen = new Map<number, { id: number; name: string }>();
    for (const e of events) {
      const { categoryId, categoryName } = e.extendedProps ?? {};
      if (categoryId && categoryName)
        seen.set(categoryId, { id: categoryId, name: categoryName });
    }
    return [...seen.values()];
  }, [events]);

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
      await onEventDrop?.(eventId, newStart, newEnd);
      enqueueSnackbar("Event rescheduled successfully", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to reschedule event", { variant: "error" });
      console.error("Error updating event:", error);
      dropInfo.revert();
    }
  };

  // Custom toolbar handlers
  const handleDatesSet = (arg: DatesSetArg): void => {
    setCurrentTitle(arg.view.title);
  };
  const handlePrev = (): void => {
    calendarRef.current?.getApi().prev();
  };
  const handleNext = (): void => {
    calendarRef.current?.getApi().next();
  };
  const handleToday = (): void => {
    calendarRef.current?.getApi().today();
  };
  const handleViewChange = (view: ViewName): void => {
    calendarRef.current?.getApi().changeView(view);
    setCurrentView(view);
  };

  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;

  const displayEvents = events.map((e) => {
    const color =
      eventColors?.[e.id] ?? getEventColor(e.extendedProps?.categoryName);
    return {
      ...e,
      title: e.extendedProps?.isRecurring ? `${e.title} ↻` : e.title,
      backgroundColor: color,
      borderColor: color,
    };
  });

  const filteredEvents =
    !compact && categoryFilter !== "all"
      ? displayEvents.filter(
          (e) =>
            e.extendedProps?.categoryName?.toLowerCase() === categoryFilter,
        )
      : displayEvents;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Custom toolbar — staff full view only */}
      {!compact && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
            flexShrink: 0,
          }}
        >
          {/* Left: view toggle + category filter */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                display: "flex",
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.15)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {(["dayGridMonth", "timeGridWeek", "timeGridDay"] as const).map(
                (view) => {
                  const label =
                    view === "dayGridMonth"
                      ? "Month"
                      : view === "timeGridWeek"
                        ? "Week"
                        : "Day";
                  const isActive = currentView === view;
                  return (
                    <Box
                      key={view}
                      component="button"
                      onClick={() => {
                        handleViewChange(view);
                      }}
                      sx={{
                        px: "16px",
                        py: "8px",
                        border: 0,
                        cursor: "pointer",
                        bgcolor: isActive ? "primary.main" : "transparent",
                        color: isActive ? "common.white" : "text.secondary",
                        fontFamily: "inherit",
                        fontSize: 14,
                        fontWeight: 500,
                        "&:hover": {
                          bgcolor: isActive ? "primary.dark" : "action.hover",
                        },
                      }}
                    >
                      {label}
                    </Box>
                  );
                },
              )}
            </Box>

            <Select
              size="small"
              value={categoryFilter}
              onChange={(e: SelectChangeEvent) => {
                setCategoryFilter(e.target.value);
              }}
              displayEmpty
              sx={{
                minWidth: 160,
                borderRadius: "8px",
                bgcolor: "background.paper",
                fontSize: 14,
              }}
            >
              <MenuItem value="all">All categories</MenuItem>
              {uniqueCategories.map((c) => (
                <MenuItem key={c.id} value={c.name.toLowerCase()}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Right: prev / month-year title / next / today */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={handlePrev}
              sx={{
                width: 32,
                height: 32,
                border: "1px solid rgba(0,0,0,0.15)",
                borderRadius: "6px",
                bgcolor: "background.paper",
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                minWidth: 170,
                textAlign: "center",
              }}
            >
              {currentTitle}
            </Typography>
            <IconButton
              size="small"
              onClick={handleNext}
              sx={{
                width: 32,
                height: 32,
                border: "1px solid rgba(0,0,0,0.15)",
                borderRadius: "6px",
                bgcolor: "background.paper",
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
            <Button
              variant="text"
              size="small"
              onClick={handleToday}
              sx={{ textTransform: "none", fontWeight: 500 }}
            >
              Today
            </Button>
          </Box>
        </Box>
      )}

      {/* Calendar grid */}
      <Box
        sx={{
          ...(compact ? {} : { flex: 1, minHeight: 0 }),
          backgroundColor: "background.paper",
          borderRadius: compact ? 3 : "8px",
          border: "1px solid",
          borderColor: compact ? "divider" : "rgba(0,0,0,0.08)",
          boxShadow: compact
            ? `0 4px 20px ${theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.08)"}`
            : "none",
          overflow: "hidden",
          "& .fc": { fontFamily: "inherit" },
          "& .fc-toolbar-title": {
            fontSize: { xs: "1.25rem", md: "1.75rem" },
            fontWeight: 700,
            letterSpacing: "-0.02em",
          },
          // Compact mode: keep FullCalendar built-in button styles
          ...(compact && {
            "& .fc-header-toolbar": {
              padding: "12px 16px",
              marginBottom: "0 !important",
            },
            "& .fc-toolbar-chunk": {
              display: "flex",
              alignItems: "center",
              "&:first-of-type": {
                minWidth: 180,
              },
              "&:last-of-type": {
                minWidth: 180,
                justifyContent: "flex-end",
              },
            },
            "& .fc-toolbar-title": {
              fontSize: "1.25rem !important",
              fontWeight: "700 !important",
            },
            "& .fc-button": {
              backgroundColor: theme.palette.primary.main,
              border: "none",
              borderRadius: "6px !important",
              textTransform: "capitalize",
              fontWeight: 600,
              padding: "6px 14px",
              fontSize: "0.8125rem",
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
            "& .fc-button-group": {
              gap: "4px",
              "& .fc-button": {
                borderRadius: "6px !important",
              },
            },
            "& .fc-today-button": {
              marginLeft: "8px !important",
            },
            "& .fc-button-active": {
              backgroundColor: `${theme.palette.primary.main} !important`,
              fontWeight: 700,
            },
          }),
          "& .fc-daygrid-day": {
            transition: "background-color 0.2s ease",
            "&:hover": { backgroundColor: theme.palette.action.hover },
          },
          "& .fc-daygrid-day-number": {
            fontSize: "0.95rem",
            fontWeight: 600,
            padding: "8px",
          },
          // Non-compact: design-system day header row
          ...(!compact && {
            "& .fc-col-header-cell": {
              backgroundColor: "#fafafa",
              borderColor: "rgba(0,0,0,0.08)",
              padding: "10px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(0,0,0,0.6)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            },
          }),
          // Compact: original header styles
          ...(compact && {
            "& .fc-col-header-cell": {
              backgroundColor: theme.palette.action.hover,
              borderColor: "divider",
              padding: "12px 4px",
              fontWeight: 700,
              textTransform: "uppercase",
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
            },
          }),
          "& .fc-scrollgrid": { border: "none", borderRadius: 2 },
          "& .fc-theme-standard td, & .fc-theme-standard th": {
            borderColor: theme.palette.divider,
          },
          // Non-compact: strip FullCalendar's default event chrome (we use custom pill renderer)
          ...(!compact && {
            "& .fc-event": {
              background: "none !important",
              border: "none !important",
              boxShadow: "none !important",
              padding: "0 !important",
              "&:hover": { transform: "none", boxShadow: "none !important" },
            },
            "& .fc-daygrid-day-frame": { minHeight: "120px" },
            "& .fc-day-today": {
              backgroundColor: "rgba(50,123,247,0.04) !important",
            },
            "& .fc-daygrid-event-harness": { marginBottom: "3px" },
            "& .fc-daygrid-day-top": { flexDirection: "row" },
          }),
          // Compact: same event chrome stripping + original sizes
          ...(compact && {
            "& .fc-day-today": {
              backgroundColor: "rgba(50,123,247,0.04) !important",
            },
            "& .fc-daygrid-day-frame": { minHeight: "110px" },
            "& .fc-event": {
              background: "none !important",
              border: "none !important",
              boxShadow: "none !important",
              padding: "0 !important",
              "&:hover": { transform: "none", boxShadow: "none !important" },
            },
            "& .fc-daygrid-event-harness": { marginBottom: "2px" },
            "& .fc-daygrid-day-number": { padding: "6px 8px" },
            "& .fc-daygrid-day-top": { flexDirection: "row" },
          }),
          "& .fc-highlight": {
            backgroundColor: theme.palette.action.selected,
          },
          "& .fc-timegrid-event": { borderRadius: 1.5 },
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={
            compact
              ? { left: "prev,next today", center: "title", right: "" }
              : false
          }
          datesSet={handleDatesSet}
          buttonText={{
            month: "Month",
            week: "Week",
            day: "Day",
            today: "Today",
          }}
          editable={!readOnly}
          selectable={!readOnly}
          selectMirror={!readOnly}
          dayMaxEvents
          weekends
          events={filteredEvents}
          select={readOnly ? undefined : handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={readOnly ? undefined : handleEventDrop}
          eventContent={(arg): JSX.Element => {
            const color =
              arg.event.backgroundColor || theme.palette.primary.main;
            const pillSx = {
              fontSize: 11,
              fontWeight: 500,
              px: "6px",
              py: "3px",
              borderRadius: "4px",
              borderLeft: `3px solid ${color}`,
              bgcolor: `${color}20`,
              color,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
              cursor: "pointer",
            };
            if (compact) {
              const time = arg.event.start
                ? new Date(arg.event.start).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "";
              return <Box sx={pillSx}>{`${time} · ${arg.event.title}`}</Box>;
            }
            return <Box sx={pillSx}>{arg.event.title}</Box>;
          }}
          dayCellContent={(arg): JSX.Element => (
            <Box
              sx={{
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                bgcolor: arg.isToday ? "primary.main" : "transparent",
                color: arg.isToday ? "primary.contrastText" : "text.primary",
                fontWeight: arg.isToday ? 700 : 500,
                fontSize: 14,
                ml: compact ? "auto" : undefined,
              }}
            >
              {arg.dayNumberText.replace(".", "")}
            </Box>
          )}
          height={compact ? "auto" : "100%"}
          nowIndicator={!compact}
          scrollTime={compact ? undefined : currentTimeStr}
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
      >
        <DialogTitle>{selectedEvent?.title}</DialogTitle>
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
        <DialogActions>
          <Button
            onClick={() => {
              setIsViewModalOpen(false);
            }}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
