"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { JSX } from "react";

import AnnouncementsCard from "@/components/volunteer/communications-card";
import DashboardRecommendations from "@/components/volunteer/dashboard-recommendations";
import MyRsvps from "@/components/volunteer/my-rsvps";
import PastEvents from "@/components/volunteer/past-events";
import RecentHours from "@/components/volunteer/recent-hours";
import VolunteerStats from "@/components/volunteer/volunteer-stats";

/** Volunteer dashboard with portal overview. */
export default function VolunteerDashboardPage(): JSX.Element {
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
      {/* Row 1 — Stats (full-width, 3-col grid inside component) */}
      <VolunteerStats />

      {/* Row 2 — My RSVPs (wider) + Announcements (narrower) */}
      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, md: 8 }}>
          <MyRsvps />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <AnnouncementsCard />
        </Grid>
      </Grid>

      {/* Row 3 — Past Events + Recent Hours (equal halves) */}
      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6 }}>
          <PastEvents />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RecentHours />
        </Grid>
      </Grid>

      {/* Row 4 — Recommendations (full-width, manages its own internal grid) */}
      <DashboardRecommendations />
    </Box>
  );
}
