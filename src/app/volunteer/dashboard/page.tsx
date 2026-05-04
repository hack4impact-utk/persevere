"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { JSX, useCallback, useState } from "react";

import { PageHeader } from "@/components/shared";
import AnnouncementsCard from "@/components/volunteer/communications-card";
import DashboardRecommendations from "@/components/volunteer/dashboard-recommendations";
import MyRsvps from "@/components/volunteer/my-rsvps";
import RecentHours from "@/components/volunteer/recent-hours";
import VolunteerStats from "@/components/volunteer/volunteer-stats";
import { useIsMobile } from "@/hooks/use-is-mobile";

/** Volunteer dashboard with portal overview. */
export default function VolunteerDashboardPage(): JSX.Element {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Volunteer";
  const [rsvpVersion, setRsvpVersion] = useState(0);
  const handleRsvpChange = useCallback(() => setRsvpVersion((v) => v + 1), []);
  const isMobile = useIsMobile();

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
      <PageHeader
        eyebrow="Volunteer Portal"
        title={`Welcome back, ${firstName}`}
        subtitle="Check out your upcoming sessions and new opportunities."
        actions={
          <>
            <Button component={Link} href="/volunteer/hours" variant="outlined">
              Log Hours
            </Button>
            <Button
              component={Link}
              href="/volunteer/opportunities"
              variant="contained"
            >
              Browse Opportunities
            </Button>
          </>
        }
      />

      <VolunteerStats />

      {isMobile ? (
        // Mobile: single-column stack ordered by actionability —
        // upcoming RSVPs first so volunteers see what's next at a glance.
        <Stack spacing={3}>
          <MyRsvps refreshKey={rsvpVersion} />
          <AnnouncementsCard />
          <DashboardRecommendations onRsvpChange={handleRsvpChange} />
          <RecentHours />
        </Stack>
      ) : (
        <Grid container spacing={3} alignItems="flex-start">
          <Grid
            size={{ xs: 12, md: 8 }}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <DashboardRecommendations onRsvpChange={handleRsvpChange} />
            <MyRsvps refreshKey={rsvpVersion} />
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <AnnouncementsCard />
            <RecentHours />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
