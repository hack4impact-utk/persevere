"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import { useVolunteerDashboard } from "@/hooks/use-volunteer-dashboard";

export default function VolunteerStats(): JSX.Element | null {
  const { data, isLoading, error } = useVolunteerDashboard();

  if (error) return null;

  const stats = [
    { label: "Verified Hours", value: data?.verifiedHours ?? 0 },
    { label: "Upcoming Events", value: data?.upcomingCount ?? 0 },
    { label: "Pending Hours", value: data?.pendingHours ?? 0 },
  ];

  return (
    <Grid container spacing={3}>
      {stats.map(({ label, value }) => (
        <Grid key={label} size={{ xs: 12, sm: 4 }}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: 1,
              height: "100%",
              bgcolor: "background.paper",
            }}
          >
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography
                variant="body1"
                color="text.secondary"
                fontWeight={500}
                sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                {label}
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : (
                <Typography variant="h3" fontWeight={800} color="primary.main">
                  {value}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
