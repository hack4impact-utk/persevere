import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
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
        maxHeight: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={3} sx={{ flexGrow: 1 }}>
        <OnboardingChecklist />
        <Box>
          <Grid container spacing={3}>
            <DocumentViewer />
          </Grid>
        </Box>
      </Stack>
    </Box>
  );
}
