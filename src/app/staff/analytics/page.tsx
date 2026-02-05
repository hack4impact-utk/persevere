import { Typography } from "@mui/material";
import { JSX } from "react";

/** Analytics dashboard for insights and metrics. */
export default function StaffAnalyticsPage(): JSX.Element {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Typography color="text.secondary">
        View insights, metrics, and analytics for your organization.
      </Typography>
    </>
  );
}
