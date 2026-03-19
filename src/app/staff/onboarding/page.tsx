import Box from "@mui/material/Box";
import { JSX } from "react";

import DocumentManager from "@/components/staff/onboarding/document-manager";

/** Volunteer onboarding management — document catalog. */
export default function StaffOnboardingPage(): JSX.Element {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 1, md: 1.5 } }}>
      <DocumentManager />
    </Box>
  );
}
