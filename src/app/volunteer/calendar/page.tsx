import { Box } from "@mui/material";
import { JSX } from "react";

import { Calendar } from "@/components/staff/calendar";

/** Read-only calendar view for volunteers. */
export default function VolunteerCalendarPage(): JSX.Element {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Calendar readOnly />
    </Box>
  );
}
