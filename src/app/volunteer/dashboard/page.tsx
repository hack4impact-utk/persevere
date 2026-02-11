import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import MyRsvps from "@/components/volunteer/my-rsvps";

/** Volunteer dashboard with portal overview. */
export default function VolunteerDashboardPage(): JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Overview of the whole portal.
      </Typography>
      <Box sx={{ maxWidth: 600 }}>
        <MyRsvps />
      </Box>
    </Box>
  );
}
