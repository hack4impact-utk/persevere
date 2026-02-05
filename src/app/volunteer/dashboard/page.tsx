import { Typography } from "@mui/material";
import { JSX } from "react";

/** Volunteer dashboard with portal overview. */
export default function VolunteerDashboardPage(): JSX.Element {
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
