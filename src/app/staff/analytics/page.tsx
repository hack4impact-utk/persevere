"use client";

import {
  Download,
  EmojiEvents,
  PieChartOutlined,
  ShowChart,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { JSX, useState } from "react";

import { PageHeader } from "@/components/shared";
import { useAnalytics } from "@/hooks/use-analytics";
import { usePortalLabel } from "@/hooks/use-portal-label";

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;
}

function getPeriodDates(p: string): {
  startDate: string | null;
  endDate: string | null;
} {
  const today = new Date();
  if (p === "30") {
    const s = new Date(today);
    s.setDate(today.getDate() - 30);
    return { startDate: fmtDate(s), endDate: fmtDate(today) };
  }
  if (p === "90") {
    const s = new Date(today);
    s.setDate(today.getDate() - 90);
    return { startDate: fmtDate(s), endDate: fmtDate(today) };
  }
  if (p === "180") {
    const s = new Date(today);
    s.setMonth(today.getMonth() - 6);
    return { startDate: fmtDate(s), endDate: fmtDate(today) };
  }
  if (p === "ytd") {
    return {
      startDate: `${today.getFullYear()}-01-01`,
      endDate: fmtDate(today),
    };
  }
  return { startDate: null, endDate: null };
}

/** Analytics dashboard for insights and metrics. */
export default function StaffAnalyticsPage(): JSX.Element {
  const portalLabel = usePortalLabel();
  const [period, setPeriod] = useState<string>("all");

  const { startDate, endDate } = getPeriodDates(period);
  const { data, isLoading, error } = useAnalytics(startDate, endDate);

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
    {
      label: "Active Locations",
      value: isLoading ? "—" : (data?.hoursByLocation.length ?? 0),
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
    label,
  }));
  const topVolNames = data?.topVolunteers.map((v) => v.name) ?? [];
  const topVolHours = data?.topVolunteers.map((v) => v.hours) ?? [];

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

      <PageHeader
        eyebrow={portalLabel}
        title="Analytics"
        subtitle="Volunteer hours, engagement, and program performance"
        actions={
          <>
            <TextField
              select
              size="small"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
              <MenuItem value="180">Last 6 months</MenuItem>
              <MenuItem value="ytd">Year to date</MenuItem>
              <MenuItem value="all">All time</MenuItem>
            </TextField>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
            >
              Export
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <Grid container spacing={3}>
        {statCards.map(({ label, value }) => (
          <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, boxShadow: 1, height: "100%" }}>
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

      {/* Two equal-width chart cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 1, height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <PieChartOutlined
                  sx={{ color: "primary.main", fontSize: 22 }}
                />
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  Hours by Volunteer Type
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {typeLabels.length === 0 && !isLoading ? (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ py: 10, textAlign: "center" }}
                >
                  No volunteer type data available.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
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
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, boxShadow: 1, height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <EmojiEvents sx={{ color: "primary.main", fontSize: 22 }} />
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  Top Volunteers
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {topVolNames.length === 0 && !isLoading ? (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ py: 10, textAlign: "center" }}
                >
                  No hours recorded in the selected range.
                </Typography>
              ) : (
                <BarChart
                  layout="horizontal"
                  yAxis={[{ scaleType: "band", data: topVolNames }]}
                  series={[
                    { data: topVolHours, color: "#327bf7", label: "Hours" },
                  ]}
                  height={280}
                  margin={{ top: 10, bottom: 30, left: 120, right: 20 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Full-width hours by month */}
      <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <ShowChart sx={{ color: "primary.main", fontSize: 22 }} />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Hours by Month
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {monthLabels.length === 0 && !isLoading ? (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ py: 10, textAlign: "center" }}
            >
              No hours data within the selected range.
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
    </Box>
  );
}
