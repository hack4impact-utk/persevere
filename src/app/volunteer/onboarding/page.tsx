import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import OnboardingChecklist from "@/components/volunteer/onboarding-checklist";

/** Full-page onboarding checklist for new volunteers. */
export default function VolunteerOnboardingPage(): JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome! Complete Your Onboarding
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Please complete the steps below to finish setting up your volunteer
        profile.
      </Typography>
      <Box sx={{ maxWidth: 600 }}>
        <OnboardingChecklist />
      </Box>
    </Box>
  );
}
