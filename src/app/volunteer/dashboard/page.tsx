import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { JSX } from "react";

import DashboardRecommendations from "@/components/volunteer/dashboard-recommendations";
import MyRsvps from "@/components/volunteer/my-rsvps";
import OnboardingChecklist from "@/components/volunteer/onboarding-checklist";

/** Volunteer dashboard with portal overview. */
export default function VolunteerDashboardPage(): JSX.Element {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 1, md: 1.5 }, pb: 4 }}>
      <Stack spacing={3} sx={{ maxWidth: 800 }}>
        <OnboardingChecklist />
        <MyRsvps />
        <DashboardRecommendations />
      </Stack>
    </Box>
  );
}
