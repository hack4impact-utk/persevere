import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

export default function HoursPage(): JSX.Element {
  return (
    <Box sx={{ px: 3, pt: { xs: 1, md: 1.5 } }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Hours
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Coming soon.
      </Typography>
    </Box>
  );
}
