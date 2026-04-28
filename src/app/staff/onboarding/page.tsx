import Box from "@mui/material/Box";
import { JSX } from "react";

import DocumentManager from "@/components/staff/onboarding/document-manager";

export default function StaffOnboardingPage(): JSX.Element {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        "& > *": { flexShrink: 0 },
        gap: 3,
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
      }}
    >
      <DocumentManager />
    </Box>
  );
}
