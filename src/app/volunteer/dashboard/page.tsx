import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import MyRsvps from "@/components/volunteer/my-rsvps";

/** Volunteer dashboard with portal overview. */
export default function VolunteerDashboardPage(): JSX.Element {
  const firstName = "Volunteer";
  const totalHours = 42;
  const monthHours = 6;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {firstName} 👋
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Here’s what’s coming up and how you're doing.
      </Typography>

      <Grid container spacing={3} component="div">
        {/* Upcoming Shifts */}
        <Grid item xs={12} md={7} component="div">
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              My Upcoming Shifts
            </Typography>
            <MyRsvps />
          </Paper>
        </Grid>

        {/* Hours Summary */}
        <Grid item xs={12} md={5} component="div">
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Hours Summary
            </Typography>

            <Typography variant="body1">Total Hours Volunteered:</Typography>
            <Typography variant="h4" sx={{ mb: 2 }}>
              {totalHours}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Hours this month: {monthHours}
            </Typography>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} component="div">
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button variant="contained">Browse Opportunities</Button>
              <Button variant="outlined">View My Schedule</Button>
              <Button variant="outlined">Log Hours</Button>
              <Button variant="outlined">Update Profile</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
