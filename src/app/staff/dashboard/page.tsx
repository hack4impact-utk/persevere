import { Typography } from "@mui/material";
import { JSX } from "react";

/** Staff dashboard with portal overview. */
export default function StaffDashboardPage(): JSX.Element {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary">
        Overview of the whole portal.
      </Typography>
    </>
  );
}
