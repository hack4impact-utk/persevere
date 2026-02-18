"use client";

import AutorenewIcon from "@mui/icons-material/Autorenew";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/material";
import { JSX } from "react";

import type { CalendarEvent } from "@/hooks/use-calendar-events";

type EventListProps = {
  events: CalendarEvent[];
  onEventClick: (id: string) => void;
};

function formatEventDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventList({
  events,
  onEventClick,
}: EventListProps): JSX.Element {
  const now = new Date().toISOString();
  const upcoming = [...events]
    .filter((e) => e.start >= now)
    .sort((a, b) => a.start.localeCompare(b.start));

  if (upcoming.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 8,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No upcoming events
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {upcoming.map((event) => {
        const maxVol = event.extendedProps?.maxVolunteers;
        const isRecurring = event.extendedProps?.isRecurring;

        return (
          <ListItem key={event.id} disablePadding divider>
            <ListItemButton
              onClick={() => {
                onEventClick(event.id);
              }}
              sx={{ py: 2, gap: 2 }}
            >
              {/* Date/time chip */}
              <Chip
                label={formatEventDateTime(event.start)}
                size="small"
                sx={{ minWidth: 180, fontWeight: 600 }}
              />

              {/* Title + recurring badge */}
              <Box
                sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}
              >
                <Typography variant="body1" fontWeight={600}>
                  {event.title}
                </Typography>
                {isRecurring && (
                  <Chip
                    icon={<AutorenewIcon fontSize="small" />}
                    label="Recurring"
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Box>

              {/* Location */}
              {event.location && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {event.location}
                  </Typography>
                </Box>
              )}

              {/* Capacity chip */}
              {maxVol != null && (
                <Chip label={`0 / ${maxVol}`} size="small" variant="outlined" />
              )}

              <ChevronRightIcon color="action" />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
