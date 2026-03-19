import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import DocumentManager from "@/components/staff/onboarding/document-manager";
import OnboardingList from "@/components/staff/onboarding/onboarding-list";

/** Volunteer onboarding management — document catalog + volunteer progress. */
export default function StaffOnboardingPage(): JSX.Element {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 1, md: 1.5 } }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Onboarding
      </Typography>

      <DocumentManager />

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" fontWeight={600} mb={2}>
        Volunteer Progress
      </Typography>
      <OnboardingList />
    </Box>
  );
}
