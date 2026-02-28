"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import { AsyncContent } from "@/components/shared";
import { useRsvps } from "@/hooks/use-rsvps";

import RsvpButton from "./rsvp-button";
import type { RsvpStatus } from "./types";
import { formatDate } from "./utils";

function getRsvpStatusColor(
  status: RsvpStatus,
): "success" | "primary" | "error" | "warning" | "default" {
  switch (status) {
    case "confirmed": {
      return "primary";
    }
    case "attended": {
      return "success";
    }
    case "declined": {
      return "error";
    }
    case "pending": {
      return "warning";
    }
    case "no_show": {
      return "default";
    }
  }
}

export default function MyRsvps(): JSX.Element {
  const { upcoming, loading, error, loadRsvps } = useRsvps();

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <EventIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            My Upcoming RSVPs
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <AsyncContent
          loading={loading}
          error={error}
          empty={upcoming.length === 0}
          emptyMessage="No upcoming RSVPs. Browse opportunities to sign up!"
        >
          <Stack spacing={2}>
            {upcoming.map((rsvp) => (
              <Box
                key={rsvp.opportunityId}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={1}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    noWrap
                    sx={{ flex: 1, minWidth: 0, mr: 1 }}
                  >
                    {rsvp.opportunityTitle ?? "Untitled Opportunity"}
                  </Typography>
                  <Chip
                    label={rsvp.rsvpStatus}
                    color={getRsvpStatusColor(rsvp.rsvpStatus)}
                    size="small"
                    sx={{ flexShrink: 0, textTransform: "capitalize" }}
                  />
                </Box>

                {rsvp.opportunityStartDate && (
                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                    <CalendarTodayIcon
                      sx={{ fontSize: 14, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(rsvp.opportunityStartDate)}
                    </Typography>
                  </Box>
                )}

                {rsvp.opportunityLocation && (
                  <Box display="flex" alignItems="center" gap={0.5} mb={1.5}>
                    <LocationOnIcon
                      sx={{ fontSize: 14, color: "text.secondary" }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      sx={{ minWidth: 0 }}
                    >
                      {rsvp.opportunityLocation}
                    </Typography>
                  </Box>
                )}

                <RsvpButton
                  opportunityId={rsvp.opportunityId}
                  isRsvped={true}
                  isFull={false}
                  onRsvpChange={() => void loadRsvps()}
                />
              </Box>
            ))}
          </Stack>
        </AsyncContent>
      </CardContent>
    </Card>
  );
}
