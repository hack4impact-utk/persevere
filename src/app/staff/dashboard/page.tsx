"use client";

import {
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import { JSX } from "react";
import * as React from "react";

import { useStaffDashboard } from "@/hooks/use-staff-dashboard";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Staff dashboard with portal overview. */
export default function StaffDashboardPage(): JSX.Element {
  const { data, isLoading, error } = useStaffDashboard();

  const activeVolunteers = data?.activeVolunteers ?? 0;
  const totalVolunteerHours = data?.totalVolunteerHours ?? 0;
  const upcomingOpportunities = data?.upcomingOpportunities ?? 0;
  const pendingRsvps = data?.pendingRsvps ?? 0;

  const upcomingList = data?.upcomingList ?? [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 1, md: 1.5 }, pb: 4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 3 }}>
          Staff Dashboard
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" fontWeight={900}>
                  {isLoading ? "—" : activeVolunteers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Volunteers
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" fontWeight={900}>
                  {isLoading ? "—" : totalVolunteerHours}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Volunteer Hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" fontWeight={900}>
                  {isLoading ? "—" : upcomingOpportunities}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming Opportunities
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" fontWeight={900}>
                  {isLoading ? "—" : pendingRsvps}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending RSVPs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
              Upcoming Opportunities
            </Typography>

            {isLoading ? (
              <Typography variant="body2" color="text.secondary">
                Loading…
              </Typography>
            ) : upcomingList.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No upcoming opportunities found.
              </Typography>
            ) : (
              <List disablePadding>
                {upcomingList.map((opp, idx) => (
                  <React.Fragment key={opp.id}>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={opp.title}
                        secondary={`${formatDate(opp.date)} • ${opp.location}`}
                        primaryTypographyProps={{ fontWeight: 700 }}
                      />
                    </ListItem>
                    {idx < upcomingList.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
