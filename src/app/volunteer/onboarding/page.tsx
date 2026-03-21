import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { JSX } from "react";

import DocumentViewer from "@/components/volunteer/onboarding/document-viewer";
import OnboardingChecklist from "@/components/volunteer/onboarding/onboarding-checklist";

export default function OnboardingPage(): JSX.Element {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 9 }}>
          <Grid container spacing={3}>
            <DocumentViewer />
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <OnboardingChecklist />
        </Grid>
      </Grid>
    </Box>
  );
}
