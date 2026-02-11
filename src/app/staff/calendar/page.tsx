import { Box } from "@mui/material";
import { JSX } from "react";

import { Calendar } from "@/components/calendar";

/** Calendar view for managing events and schedules. */
export default function StaffCalendarPage(): JSX.Element {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Calendar />
    </Box>
  );
}
