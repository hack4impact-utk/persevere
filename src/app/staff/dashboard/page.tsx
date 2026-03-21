"use client";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { JSX } from "react";
import * as React from "react";

import { EmptyState } from "@/components/ui";
import {
  type PendingHoursEntry,
  type RecentActivityItem,
  useStaffDashboard,
} from "@/hooks/use-staff-dashboard";

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

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function ContentCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}): JSX.Element {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 1, height: "100%" }}>
      <CardContent
        sx={{
          p: 3,
          "&:last-child": { pb: 3 },
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1 }}>{children}</Box>
        {footer && <Box sx={{ mt: 2 }}>{footer}</Box>}
      </CardContent>
    </Card>
  );
}

/** Staff dashboard with portal overview. */
export default function StaffDashboardPage(): JSX.Element {
  const { data, isLoading, error } = useStaffDashboard();

  const activeVolunteers = data?.activeVolunteers ?? 0;
  const totalVolunteerHours = data?.totalVolunteerHours ?? 0;
  const upcomingOpportunities = data?.upcomingOpportunities ?? 0;
  const pendingRsvps = data?.pendingRsvps ?? 0;
  const upcomingList = data?.upcomingList ?? [];
  const pendingHoursList: PendingHoursEntry[] = data?.pendingHoursList ?? [];
  const recentActivity: RecentActivityItem[] = data?.recentActivity ?? [];

  const statCards = [
    { label: "Active Volunteers", value: activeVolunteers },
    { label: "Total Volunteer Hours", value: totalVolunteerHours },
    { label: "Upcoming Opportunities", value: upcomingOpportunities },
    { label: "Pending RSVPs", value: pendingRsvps },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        gap: 3,
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
      }}
    >
      {error && <Alert severity="error">{error}</Alert>}

      {/* Stat cards row — 6 cards */}
      <Grid container spacing={3}>
        {statCards.map(({ label, value }) => (
          <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, boxShadow: 1, height: "100%" }}>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  fontWeight={500}
                  sx={{
                    mb: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {label}
                </Typography>
                <Typography variant="h3" fontWeight={800} color="primary.main">
                  {isLoading ? "—" : value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Content section — 2-column layout */}
      <Grid container spacing={3} alignItems="stretch">
        {/* Left column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3} direction="column">
            {/* Pending Hours Approvals */}
            <Grid>
              <ContentCard
                title="Pending Hours Approvals"
                footer={
                  <MuiLink
                    component={NextLink}
                    href="/staff/volunteers"
                    variant="body2"
                    underline="hover"
                  >
                    View all
                  </MuiLink>
                }
              >
                {isLoading || !data ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading…
                  </Typography>
                ) : pendingHoursList.length === 0 ? (
                  <EmptyState message="No pending hours." />
                ) : (
                  <List disablePadding>
                    {pendingHoursList.map((entry, idx) => (
                      <React.Fragment key={entry.id}>
                        <ListItem sx={{ px: 1, py: 1 }}>
                          <ListItemText
                            primary={entry.volunteerName}
                            secondary={`${entry.hours} hrs · ${formatDate(entry.date)}`}
                            primaryTypographyProps={{
                              variant: "subtitle2",
                              fontWeight: 600,
                            }}
                            secondaryTypographyProps={{ variant: "caption" }}
                          />
                        </ListItem>
                        {idx < pendingHoursList.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </ContentCard>
            </Grid>

            {/* Upcoming Opportunities */}
            <Grid>
              <ContentCard title="Upcoming Opportunities">
                {isLoading || !data ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading…
                  </Typography>
                ) : upcomingList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No upcoming opportunities.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {upcomingList.map((opp, idx) => (
                      <React.Fragment key={opp.id}>
                        <ListItem
                          disableGutters
                          sx={{
                            px: 1,
                            py: 1.5,
                            borderRadius: 1,
                            transition: "background-color 0.15s",
                            "&:hover": { backgroundColor: "action.hover" },
                          }}
                        >
                          <ListItemText
                            primary={opp.title}
                            secondary={`${formatDate(opp.startDate)} • ${opp.location}`}
                            primaryTypographyProps={{
                              variant: "subtitle2",
                              fontWeight: 600,
                            }}
                            secondaryTypographyProps={{ variant: "caption" }}
                          />
                        </ListItem>
                        {idx < upcomingList.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </ContentCard>
            </Grid>
          </Grid>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={3} direction="column">
            {/* Recent Activity */}
            <Grid>
              <ContentCard title="Recent Activity">
                {isLoading || !data ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading…
                  </Typography>
                ) : recentActivity.length === 0 ? (
                  <EmptyState message="No recent activity." />
                ) : (
                  <List disablePadding>
                    {recentActivity.map((item, idx) => (
                      <React.Fragment
                        key={`${item.type}-${item.timestamp}-${idx}`}
                      >
                        <ListItem disableGutters sx={{ px: 1, py: 1 }}>
                          <ListItemText
                            primary={item.label}
                            secondary={formatRelative(item.timestamp)}
                            primaryTypographyProps={{ variant: "body2" }}
                            secondaryTypographyProps={{ variant: "caption" }}
                          />
                        </ListItem>
                        {idx < recentActivity.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </ContentCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
