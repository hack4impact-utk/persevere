"use client";

import AutorenewIcon from "@mui/icons-material/Autorenew";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import { EmptyState, StatusBadge } from "@/components/ui";
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

function getStatusColor(
  status: string | undefined,
): "success" | "default" | "primary" | "error" {
  switch (status) {
    case "open": {
      return "success";
    }
    case "full": {
      return "default";
    }
    case "completed": {
      return "primary";
    }
    case "canceled": {
      return "error";
    }
    default: {
      return "default";
    }
  }
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
      <EmptyState
        icon={<EventIcon sx={{ fontSize: 64 }} />}
        message="No upcoming events"
        subMessage="Check back soon or create a new event"
      />
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
        },
        gap: 3,
      }}
    >
      {upcoming.map((event) => {
        const { maxVolunteers, rsvpCount, status, isRecurring } =
          event.extendedProps ?? {};

        return (
          <Card
            key={event.id}
            onClick={() => {
              onEventClick(event.id);
            }}
            sx={{
              borderRadius: 2,
              boxShadow: 2,
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
            }}
          >
            <CardContent sx={{ p: 2.5, flex: 1 }}>
              {/* Title row with badges */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                gap={1}
                mb={1}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {event.title}
                </Typography>
                <Box display="flex" gap={0.5} flexShrink={0}>
                  {status && (
                    <StatusBadge
                      label={status}
                      color={getStatusColor(status)}
                    />
                  )}
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
              </Box>

              {/* Description */}
              {event.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  mb={1.5}
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {event.description}
                </Typography>
              )}

              {/* Date/time */}
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <CalendarTodayIcon
                  sx={{ fontSize: 14, color: "text.secondary" }}
                />
                <Typography variant="body2" color="text.secondary">
                  {formatEventDateTime(event.start)}
                </Typography>
              </Box>

              {/* Location */}
              {event.location && (
                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                  <LocationOnIcon
                    sx={{ fontSize: 14, color: "text.secondary" }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{ minWidth: 0 }}
                  >
                    {event.location}
                  </Typography>
                </Box>
              )}

              {/* Capacity */}
              {maxVolunteers != null && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PeopleIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {rsvpCount ?? 0} / {maxVolunteers} volunteers
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
