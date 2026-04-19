"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { JSX } from "react";

import AnnouncementsCard from "@/components/volunteer/communications-card";
import DashboardRecommendations from "@/components/volunteer/dashboard-recommendations";
import MyRsvps from "@/components/volunteer/my-rsvps";
import RecentHours from "@/components/volunteer/recent-hours";
import VolunteerStats from "@/components/volunteer/volunteer-stats";

/** Volunteer dashboard with portal overview. */
export default function VolunteerDashboardPage(): JSX.Element {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Volunteer";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        gap: 3,
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
      }}
    >
      {/* Page Header Area */}
      <Box sx={{ pb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.5,
            fontWeight: 600,
            color: "text.secondary",
            display: "block",
            mb: 0.5,
          }}
        >
          Volunteer Portal
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 500,
                color: "text.primary",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Welcome back, {firstName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Check out your upcoming sessions and new opportunities.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              component={Link}
              href="/volunteer/hours"
              variant="outlined"
            >
              Log Hours
            </Button>
            <Button
              component={Link}
              href="/volunteer/opportunities"
              variant="contained"
            >
              Browse Opportunities
            </Button>
          </Box>
        </Stack>
      </Box>

      {/* Row 1 — Stats */}
      <VolunteerStats />

      {/* Row 2 — Main Grid */}
      <Grid container spacing={3} alignItems="flex-start">
        {/* Left Column: Recommendations & Upcoming */}
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <DashboardRecommendations />
          <MyRsvps />
        </Grid>

        {/* Right Column: Announcements & Hours */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <AnnouncementsCard />
          <RecentHours />
        </Grid>
      </Grid>
    </Box>
  );
}
