"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
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
import { StatusBadge } from "@/components/ui";
import { useVolunteerHours } from "@/hooks/use-volunteer-hours";

import { formatDate } from "./utils";

const HOURS_STATUS_COLOR = {
  approved: "success",
  pending: "warning",
  rejected: "error",
} as const;

export default function RecentHours(): JSX.Element {
  const { hours, loading, error } = useVolunteerHours();

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2, height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AccessTimeIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Recent Hours
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <AsyncContent
          loading={loading}
          error={error}
          empty={hours.length === 0}
          emptyMessage="No hours logged yet."
        >
          <Box sx={{ overflowY: "auto", maxHeight: 240 }}>
            <Stack spacing={2}>
              {hours.map((entry) => (
                <Box
                  key={entry.id}
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
                    mb={0.5}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      noWrap
                      sx={{ flex: 1, minWidth: 0, mr: 1 }}
                    >
                      {entry.opportunityTitle ?? "General hours"}
                    </Typography>
                    <StatusBadge
                      label={entry.status}
                      color={HOURS_STATUS_COLOR[entry.status]}
                      sx={{ flexShrink: 0 }}
                    />
                  </Box>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(entry.date)}
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {entry.hours} hrs
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </AsyncContent>

        <Box mt={2}>
          <Link
            component={NextLink}
            href="/volunteer/hours"
            variant="body2"
            underline="hover"
          >
            View all hours →
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
}
