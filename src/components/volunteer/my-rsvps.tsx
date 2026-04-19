"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import { AsyncContent } from "@/components/shared";
import { getRsvpStatusColor, StatusBadge } from "@/components/ui";
import { useRsvps } from "@/hooks/use-rsvps";

import { formatTime } from "./utils";

/** Returns a compact "Mon DD · H:MM AM" string, or empty string if no date. */
function getCompactDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const datePart = d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timePart = formatTime(dateStr);
  return `${datePart} · ${timePart}`;
}

export default function MyRsvps(): JSX.Element {
  const { upcoming, loading, error } = useRsvps();

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2, height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <EventIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" fontWeight={700}>
            Your Upcoming Events
          </Typography>
        </Box>

        <AsyncContent
          loading={loading}
          error={error}
          empty={upcoming.length === 0}
          emptyMessage="No upcoming RSVPs. Browse opportunities to sign up!"
        >
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 500 }}>
              {upcoming.map((rsvp, i) => (
                <Box
                  key={rsvp.opportunityId}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr 1fr auto",
                    alignItems: "center",
                    gap: 1.5,
                    p: "12px 4px",
                    borderTop: i === 0 ? "none" : "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {rsvp.opportunityTitle ?? "Untitled Opportunity"}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={0.5}>
                    <CalendarTodayIcon
                      sx={{ fontSize: 13, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {getCompactDate(rsvp.opportunityStartDate)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={0.5}>
                    <LocationOnIcon
                      sx={{ fontSize: 13, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {rsvp.opportunityLocation || "TBD"}
                    </Typography>
                  </Box>

                  <StatusBadge
                    label={rsvp.rsvpStatus}
                    color={getRsvpStatusColor(rsvp.rsvpStatus)}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </AsyncContent>
      </CardContent>
    </Card>
  );
}
