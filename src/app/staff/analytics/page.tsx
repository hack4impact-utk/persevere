import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

/** Analytics dashboard for insights and metrics. */
export default function StaffAnalyticsPage(): JSX.Element {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 4 } }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        Analytics
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        View insights, metrics, and analytics for your organization.
      </Typography>
    </Box>
  );
}
