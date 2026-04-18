"use client";

import { Download, EmojiEvents } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { Fragment, JSX, useState } from "react";

import { useAnalytics } from "@/hooks/use-analytics";

/** Analytics dashboard for insights and metrics. */
export default function StaffAnalyticsPage(): JSX.Element {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data, isLoading, error } = useAnalytics(
    startDate || null,
    endDate || null,
  );

  function handleExport(): void {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const query = params.size > 0 ? `?${params.toString()}` : "";
    const link = document.createElement("a");
    link.href = `/api/staff/analytics/export${query}`;
    link.download = "monthly-report.csv";
    document.body.append(link);
    link.click();
    link.remove();
  }

  const statCards = [
    {
      label: "Total Hours",
      value: isLoading ? "—" : (data?.totalHours ?? 0).toFixed(2),
    },
    {
      label: "Active Volunteers",
      value: isLoading ? "—" : (data?.totalVolunteers ?? 0),
    },
    {
      label: "Attendance Rate",
      value: isLoading
        ? "—"
        : `${((data?.attendanceRate ?? 0) * 100).toFixed(1)}%`,
    },
  ];

  const monthLabels = data?.hoursByMonth.map((r) => r.month) ?? [];
  const monthValues = data?.hoursByMonth.map((r) => r.hours) ?? [];

  const typeLabels =
    data?.hoursByVolunteerType.map((r) => r.volunteerType) ?? [];
  const typeValues = data?.hoursByVolunteerType.map((r) => r.hours) ?? [];

  const pieData = typeLabels.map((label, idx) => ({
    id: label,
    value: typeValues[idx],
    label: label,
  }));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        "& > *": { flexShrink: 0 },
        gap: 3,
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
      }}
    >
      {error && <Alert severity="error">{error}</Alert>}

      {/* Date range filter + export */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
          }}
        >
          <TextField
            label="Start Date"
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
            }}
            sx={{ width: 150 }}
          />
          <TextField
            label="End Date"
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
            }}
            sx={{ width: 150 }}
          />
        </Box>
        <Button
          variant="contained"
          disableElevation
          startIcon={<Download />}
          onClick={handleExport}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Export
        </Button>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={3}>
        {statCards.map(({ label, value }) => (
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
                  fontWeight={500}
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 2 }}
                >
                  {label}
                </Typography>
                <Typography variant="h3" fontWeight={800} color="primary.main">
                  {value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Hours by month */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: 1,
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 2, color: "text.primary" }}
              >
                Hours by Month
              </Typography>
              {monthLabels.length === 0 && !isLoading ? (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ py: 10, textAlign: "center" }}
                >
                  No hours data strictly within the selected range.
                </Typography>
              ) : (
                <LineChart
                  xAxis={[{ scaleType: "point", data: monthLabels }]}
                  series={[
                    {
                      data: monthValues,
                      label: "Total Hours",
                      area: true,
                      color: "#327bf7",
                      showMark: true,
                    },
                  ]}
                  height={320}
                  margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
                  sx={{
                    ".MuiLineElement-root": { strokeWidth: 3 },
                    ".MuiAreaElement-root": { fillOpacity: 0.2 },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Hours by volunteer type */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent
              sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 2, color: "text.primary" }}
              >
                Hours by Volunteer Type
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {typeLabels.length === 0 && !isLoading ? (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ py: 5, textAlign: "center" }}
                  >
                    No volunteer type data available.
                  </Typography>
                ) : (
                  <PieChart
                    series={[
                      {
                        data: pieData,
                        innerRadius: 50,
                        outerRadius: 100,
                        paddingAngle: 5,
                        cornerRadius: 8,
                        highlightScope: { fade: "global", highlight: "item" },
                        faded: {
                          innerRadius: 50,
                          additionalRadius: -30,
                          color: "gray",
                        },
                      },
                    ]}
                    height={280}
                    margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    slotProps={{
                      legend: {
                        position: { vertical: "middle", horizontal: "end" },
                      },
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top volunteers list */}
      <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box
            sx={{
              p: 3,
              pb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#FFC837",
                color: "#B36B00",
                width: 32,
                height: 32,
              }}
            >
              <EmojiEvents fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Top Volunteers Leaderboard
            </Typography>
          </Box>
          {isLoading ? (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ p: 4, textAlign: "center" }}
            >
              Loading leaderboard…
            </Typography>
          ) : (data?.topVolunteers ?? []).length === 0 ? (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ p: 4, textAlign: "center" }}
            >
              No hours recorded in the selected range to display a leaderboard.
            </Typography>
          ) : (
            <List disablePadding>
              {(data?.topVolunteers ?? []).map((v, idx) => (
                <Fragment key={v.name}>
                  <ListItem
                    sx={{
                      px: 3,
                      py: 2,
                      transition: "background-color 0.2s",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.02)" },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor:
                            idx === 0
                              ? "#FFD700"
                              : idx === 1
                                ? "#C0C0C0"
                                : idx === 2
                                  ? "#cd7f32"
                                  : "primary.light",
                          color:
                            idx < 3
                              ? "rgba(0,0,0,0.7)"
                              : "primary.contrastText",
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={v.name}
                      secondary={`${v.hours.toFixed(2)} hours logged`}
                      primaryTypographyProps={{
                        variant: "subtitle1",
                        fontWeight: 600,
                        color: "text.primary",
                      }}
                      secondaryTypographyProps={{
                        variant: "body2",
                        fontWeight: 500,
                        color: "primary.main",
                      }}
                    />
                  </ListItem>
                  {idx < (data?.topVolunteers ?? []).length - 1 && (
                    <Divider component="li" />
                  )}
                </Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
