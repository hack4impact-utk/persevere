import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

type Opportunity = {
  title: string;
  when: string;
  location: string;
  status: string;
};

function StatCard(props: {
  title: string;
  value: string | number;
  subtitle?: string;
}): JSX.Element {
  const { title, value, subtitle } = props;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Staff dashboard with portal overview. */
export default function StaffDashboardPage(): JSX.Element {
  const stats = {
    volunteers: 128,
    hours: 102,
    upcomingEvents: 5,
    pendingRsvps: 2,
  };

  //example oppotuniites
  const upcomingOpportunities: Opportunity[] = [
    {
      title: "Food Pantry Shift",
      when: "Thu • 9:00 AM",
      location: "Main Center",
      status: "Open",
    },
    {
      title: "Community Cleanup",
      when: "Sat • 10:00 AM",
      location: "River Park",
      status: "Filling",
    },
    {
      title: "After-School Tutoring",
      when: "Mon • 3:30 PM",
      location: "North School",
      status: "Open",
    },
    {
      title: "Donation Sorting",
      when: "Tue • 1:00 PM",
      location: "Warehouse",
      status: "Open",
    },
    {
      title: "Senior Check-ins",
      when: "Wed • 11:00 AM",
      location: "Remote",
      status: "Limited",
    },
  ];

  const statusChipVariant = (status: string) => {
    if (status === "Limited") return "outlined";
    return "filled";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Staff Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Key stats and upcoming opportunities.
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Volunteers"
            value={stats.volunteers}
            subtitle="Active volunteers"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Hours"
            value={stats.hours}
            subtitle="Total hours logged"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            subtitle="Next 30 days"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Pending RSVPs"
            value={stats.pendingRsvps}
            subtitle="Need review/approval"
          />
        </Grid>
      </Grid>

      {/* Upcoming Opportunities */}
      <Card variant="outlined">
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography variant="h6">Upcoming Opportunities</Typography>
            <Button size="small" variant="text">
              View all
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Next 5 opportunities.
          </Typography>

          <List disablePadding>
            {upcomingOpportunities.map((opp, idx) => (
              <Box key={`${opp.title}-${idx}`}>
                <ListItem
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={opp.status}
                        size="small"
                        variant={statusChipVariant(opp.status)}
                      />
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {opp.title}
                      </Typography>
                    }
                    secondary={`${opp.when} • ${opp.location}`}
                  />
                </ListItem>
                {idx < upcomingOpportunities.length - 1 ? <Divider /> : null}
              </Box>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
