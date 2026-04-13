"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import {
  Box,
  Card,
  CardContent,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts";
import { JSX, useMemo } from "react";

import { StatusBadge } from "@/components/ui";
import type { FetchVolunteerByIdResult } from "@/services/volunteer-client.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isoToLabel(iso: string): string {
  const [year, month] = iso.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "en-US",
    { month: "short", year: "2-digit" },
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  iconColor = "primary.main",
}: {
  icon: JSX.Element;
  label: string;
  value: string | number;
  iconColor?: string;
}): JSX.Element {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: 2,
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Box sx={{ color: iconColor, display: "flex" }}>{icon}</Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight={700}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

type VolunteerImpactTabProps = {
  volunteer: FetchVolunteerByIdResult;
  onVolunteerUpdated?: () => void;
};

export function VolunteerImpactTab({
  volunteer,
}: VolunteerImpactTabProps): JSX.Element {
  const hoursBreakdown = volunteer.hoursBreakdown ?? [];
  const recentOpportunities = volunteer.recentOpportunities ?? [];

  const approvedHours = useMemo(
    () =>
      hoursBreakdown
        .filter((h) => h.status === "approved")
        .reduce((sum, h) => sum + (h.hours ?? 0), 0),
    [hoursBreakdown],
  );

  const pendingHours = useMemo(
    () =>
      hoursBreakdown
        .filter((h) => h.status === "pending")
        .reduce((sum, h) => sum + (h.hours ?? 0), 0),
    [hoursBreakdown],
  );

  const approvedCount = useMemo(
    () => hoursBreakdown.filter((h) => h.status === "approved").length,
    [hoursBreakdown],
  );

  const rejectedCount = useMemo(
    () => hoursBreakdown.filter((h) => h.status === "rejected").length,
    [hoursBreakdown],
  );

  const approvalRate = useMemo(() => {
    const total = approvedCount + rejectedCount;
    if (total === 0) return "—";
    return `${Math.round((approvedCount / total) * 100)}%`;
  }, [approvedCount, rejectedCount]);

  const eventsCount = useMemo(() => {
    const titles = new Set([
      ...hoursBreakdown.map((h) => h.opportunityTitle).filter(Boolean),
      ...recentOpportunities.map((r) => r.opportunityTitle).filter(Boolean),
    ]);
    return titles.size;
  }, [hoursBreakdown, recentOpportunities]);

  const hoursByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of hoursBreakdown.filter(
      (h) => h.status === "approved" && h.date,
    )) {
      const key = formatMonthKey(h.date);
      map.set(key, (map.get(key) ?? 0) + (h.hours ?? 0));
    }
    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    return {
      labels: sorted.map(([k]) => isoToLabel(k)),
      data: sorted.map(([, v]) => v),
    };
  }, [hoursBreakdown]);

  const sortedHours = useMemo(
    () =>
      [...hoursBreakdown].sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }),
    [hoursBreakdown],
  );

  const hasHours = hoursBreakdown.length > 0;

  return (
    <Stack spacing={3}>
      {/* Stat Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {[
          {
            icon: <AccessTimeIcon />,
            label: "Total Hours Logged",
            value: approvedHours.toFixed(2),
            iconColor: "primary.main",
          },
          {
            icon: <EventAvailableIcon />,
            label: "Events Volunteered",
            value: eventsCount,
            iconColor: "success.main",
          },
          {
            icon: <HourglassEmptyIcon />,
            label: "Pending Hours",
            value: pendingHours.toFixed(2),
            iconColor: "warning.main",
          },
          {
            icon: <CheckCircleOutlineIcon />,
            label: "Approval Rate",
            value: approvalRate,
            iconColor: "info.main",
          },
        ].map((card) => (
          <Box
            key={card.label}
            sx={{ width: { xs: "calc(50% - 8px)", sm: "calc(25% - 12px)" } }}
          >
            <StatCard {...card} />
          </Box>
        ))}
      </Box>

      {/* Charts */}
      {hoursByMonth.labels.length > 0 && (
        <Card
          elevation={0}
          sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Hours Over Time
            </Typography>
            <BarChart
              xAxis={[{ scaleType: "band", data: hoursByMonth.labels }]}
              series={[
                {
                  data: hoursByMonth.data,
                  label: "Approved Hours",
                  color: "#327bf7",
                },
              ]}
              height={220}
              margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Service History */}
      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Service History
          </Typography>
          {hasHours ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Opportunity</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Hours</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedHours.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {entry.opportunityTitle ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {formatDate(entry.date)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {(entry.hours ?? 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={entry.status}
                          color={
                            entry.status === "approved"
                              ? "success"
                              : entry.status === "rejected"
                                ? "error"
                                : "warning"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {entry.notes ?? "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: "italic" }}
            >
              No hours recorded
            </Typography>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
