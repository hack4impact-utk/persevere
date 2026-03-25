"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HistoryIcon from "@mui/icons-material/History";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { JSX } from "react";

import { AsyncContent } from "@/components/shared";
import { getRsvpStatusColor, StatusBadge } from "@/components/ui";
import { useRsvps } from "@/hooks/use-rsvps";

import { formatDate } from "./utils";

export default function PastEvents(): JSX.Element {
  const { past, loading, error } = useRsvps();

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2, height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Past Events
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <AsyncContent
          loading={loading}
          error={error}
          empty={past.length === 0}
          emptyMessage="No past events yet."
        >
          <Box sx={{ overflowY: "auto", maxHeight: 240 }}>
            <Stack spacing={2}>
              {past.map((rsvp) => (
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
                    <StatusBadge
                      label={rsvp.rsvpStatus}
                      color={getRsvpStatusColor(rsvp.rsvpStatus)}
                      sx={{ flexShrink: 0 }}
                    />
                  </Box>

                  {rsvp.opportunityStartDate && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CalendarTodayIcon
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(rsvp.opportunityStartDate)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        </AsyncContent>

        <Box mt={2}>
          <Link
            component={NextLink}
            href="/volunteer/opportunities"
            variant="body2"
            underline="hover"
          >
            View all opportunities →
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
}
