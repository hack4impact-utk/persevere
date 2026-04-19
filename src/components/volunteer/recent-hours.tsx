"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { JSX } from "react";

import { AsyncContent } from "@/components/shared";
import { StatusBadge } from "@/components/ui";
import { useVolunteerDashboard } from "@/hooks/use-volunteer-dashboard";
import { useVolunteerHours } from "@/hooks/use-volunteer-hours";

const HOURS_STATUS_COLOR = {
  approved: "success",
  pending: "warning",
  rejected: "error",
} as const;

export default function RecentHours(): JSX.Element {
  const { hours, loading, error } = useVolunteerHours();
  const { data: dashboardData } = useVolunteerDashboard();

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2, height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AccessTimeIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" fontWeight={700}>
            Hours This Month
          </Typography>
        </Box>

        {/* Progress bar mock based on verified hours */}
        {dashboardData && (
          <Box mb={2}>
            <Box display="flex" alignItems="baseline" gap={1} mb={1}>
              <Typography
                variant="h3"
                fontWeight={800}
                color="primary.main"
                lineHeight={1}
              >
                {dashboardData.verifiedHours}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                verified hours so far
              </Typography>
            </Box>
            <Box
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "rgba(50,123,247,.16)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  bgcolor: "primary.main",
                  width: `${Math.min((dashboardData.verifiedHours / 15) * 100, 100)}%`,
                }}
              />
            </Box>
          </Box>
        )}

        <AsyncContent
          loading={loading}
          error={error}
          empty={hours.length === 0}
          emptyMessage="No hours logged yet."
        >
          <Box sx={{ overflowY: "auto", maxHeight: 240 }}>
            <Stack spacing={0}>
              {hours.map((entry, i) => (
                <Box
                  key={entry.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                    py: 1,
                    borderTop: i === 0 ? "none" : "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    {entry.opportunityTitle ?? "General hours"}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="text.primary"
                  >
                    {entry.hours} hr
                  </Typography>
                  <StatusBadge
                    label={entry.status}
                    color={HOURS_STATUS_COLOR[entry.status]}
                    sx={{ borderRadius: 1 }}
                  />
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
