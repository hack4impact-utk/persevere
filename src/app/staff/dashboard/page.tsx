import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

/** Staff dashboard with portal overview. */
export default function StaffDashboardPage(): JSX.Element {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 4 } }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        Overview of the whole portal.
      </Typography>
    </Box>
  );
}
