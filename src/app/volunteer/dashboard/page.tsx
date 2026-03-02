import Box from "@mui/material/Box";
import { JSX } from "react";

import MyRsvps from "@/components/volunteer/my-rsvps";

/** Volunteer dashboard with portal overview. */
export default function VolunteerDashboardPage(): JSX.Element {
  return (
    <Box sx={{ px: 3, pt: { xs: 1, md: 1.5 } }}>
      <Box sx={{ maxWidth: 600 }}>
        <MyRsvps />
      </Box>
    </Box>
  );
}
