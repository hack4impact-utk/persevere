import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import DocumentViewer from "@/components/volunteer/onboarding/document-viewer";
import OnboardingChecklist from "@/components/volunteer/onboarding/onboarding-checklist";

export default function OnboardingPage(): JSX.Element {
  return (
    <Box sx={{ px: 3, pt: { xs: 1, md: 1.5 }, pb: 4 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Onboarding
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Complete all steps below to finish your onboarding.
      </Typography>

      <OnboardingChecklist />

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" fontWeight={600} mb={2}>
        Documents
      </Typography>
      <DocumentViewer />
    </Box>
  );
}
