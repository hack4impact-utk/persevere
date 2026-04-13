"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { BarChart } from "@mui/x-charts";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/shared";
import { EmptyState, getRsvpStatusColor, StatusBadge } from "@/components/ui";
import { useHours } from "@/hooks/use-hours";
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
  onVolunteerUpdated,
}: VolunteerImpactTabProps): JSX.Element {
  const hoursBreakdown = volunteer.hoursBreakdown ?? [];
  const recentOpportunities = volunteer.recentOpportunities ?? [];

  const [hoursActionLoading, setHoursActionLoading] = useState<number | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [hoursDeleteTargetId, setHoursDeleteTargetId] = useState<number | null>(
    null,
  );

  const { enqueueSnackbar } = useSnackbar();
  const { approveHours, rejectHours, deleteHours } = useHours();

  const handleApproveHours = useCallback(
    async (hoursId: number): Promise<void> => {
      setHoursActionLoading(hoursId);
      const result = await approveHours(hoursId);
      if (result) {
        enqueueSnackbar("Hours approved", { variant: "success" });
        onVolunteerUpdated?.();
      } else {
        enqueueSnackbar("Failed to approve hours", { variant: "error" });
      }
      setHoursActionLoading(null);
    },
    [approveHours, enqueueSnackbar, onVolunteerUpdated],
  );

  const handleRejectConfirm = useCallback(async (): Promise<void> => {
    if (rejectTarget === null) return;
    const id = rejectTarget;
    setHoursActionLoading(id);
    const result = await rejectHours(id, rejectReason || undefined);
    if (result) {
      enqueueSnackbar("Hours rejected", { variant: "success" });
      setRejectTarget(null);
      setRejectReason("");
      onVolunteerUpdated?.();
    } else {
      enqueueSnackbar("Failed to reject hours", { variant: "error" });
    }
    setHoursActionLoading(null);
  }, [
    rejectTarget,
    rejectReason,
    rejectHours,
    enqueueSnackbar,
    onVolunteerUpdated,
  ]);

  const handleDeleteHoursConfirm = useCallback(async (): Promise<void> => {
    if (hoursDeleteTargetId == null) return;
    const id = hoursDeleteTargetId;
    setHoursDeleteTargetId(null);
    setHoursActionLoading(id);
    const success = await deleteHours(id);
    if (success) {
      enqueueSnackbar("Hours entry deleted", { variant: "success" });
      onVolunteerUpdated?.();
    } else {
      enqueueSnackbar("Failed to delete hours entry", { variant: "error" });
    }
    setHoursActionLoading(null);
  }, [hoursDeleteTargetId, deleteHours, enqueueSnackbar, onVolunteerUpdated]);

  // ── Stats ──────────────────────────────────────────────────────────────────

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
      ...hoursBreakdown
        .map((h) => h.opportunityTitle)
        .filter((t): t is string => t !== null && t !== undefined),
      ...recentOpportunities
        .map((r) => r.opportunityTitle)
        .filter((t): t is string => t !== null && t !== undefined),
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

  const hoursByOpportunity = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of hoursBreakdown.filter(
      (h) => h.status === "approved" && h.opportunityTitle,
    )) {
      const key = h.opportunityTitle!;
      map.set(key, (map.get(key) ?? 0) + (h.hours ?? 0));
    }
    const sorted = [...map.entries()].sort(([, a], [, b]) => b - a);
    return {
      labels: sorted.map(([k]) => k),
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
  const hasRsvps = recentOpportunities.length > 0;

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
      {(hoursByMonth.labels.length > 0 ||
        hoursByOpportunity.labels.length > 0) && (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          {hoursByMonth.labels.length > 0 && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "grey.200",
                  borderRadius: 2,
                }}
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
            </Box>
          )}

          {hoursByOpportunity.labels.length > 0 && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "grey.200",
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Hours by Opportunity
                  </Typography>
                  <BarChart
                    layout="horizontal"
                    yAxis={[
                      {
                        scaleType: "band",
                        data: hoursByOpportunity.labels,
                        tickLabelStyle: { fontSize: 11 },
                      },
                    ]}
                    series={[
                      {
                        data: hoursByOpportunity.data,
                        label: "Hours",
                        color: "#2e7d32",
                      },
                    ]}
                    height={Math.max(
                      220,
                      hoursByOpportunity.labels.length * 36 + 60,
                    )}
                    margin={{ top: 10, bottom: 30, left: 140, right: 10 }}
                  />
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
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
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedHours.map((entry) => {
                    const isPending = entry.status === "pending";
                    const isBusy = hoursActionLoading === entry.id;
                    return (
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
                              maxWidth: 160,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {entry.notes ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.25}
                            justifyContent="flex-end"
                          >
                            {isPending && (
                              <Tooltip title="Approve hours">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() =>
                                      void handleApproveHours(entry.id)
                                    }
                                    disabled={isBusy}
                                    sx={{ p: 0.5 }}
                                  >
                                    {isBusy ? (
                                      <CircularProgress size={14} />
                                    ) : (
                                      <CheckCircleIcon
                                        sx={{ fontSize: "1rem" }}
                                      />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {isPending && (
                              <Tooltip title="Reject hours">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setRejectTarget(entry.id)}
                                    disabled={isBusy}
                                    sx={{ p: 0.5 }}
                                  >
                                    {isBusy ? (
                                      <CircularProgress size={14} />
                                    ) : (
                                      <CloseIcon sx={{ fontSize: "1rem" }} />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {entry.status !== "approved" && (
                              <Tooltip title="Delete entry">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setHoursDeleteTargetId(entry.id)
                                    }
                                    disabled={isBusy}
                                    sx={{ p: 0.5 }}
                                  >
                                    {isBusy ? (
                                      <CircularProgress size={14} />
                                    ) : (
                                      <DeleteOutlineIcon
                                        sx={{ fontSize: "1rem" }}
                                      />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyState message="No hours logged yet." />
          )}
        </CardContent>
      </Card>

      {/* Recent RSVPs */}
      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Recent RSVPs
          </Typography>
          {hasRsvps ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>RSVP Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOpportunities.map((opp) => (
                    <TableRow key={opp.opportunityId} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {opp.opportunityTitle ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {formatDate(opp.opportunityStartDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 160,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {opp.opportunityLocation ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={opp.rsvpStatus}
                          color={getRsvpStatusColor(opp.rsvpStatus)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyState message="No RSVPs on record." />
          )}
        </CardContent>
      </Card>

      {/* Reject Hours Dialog */}
      <Dialog
        open={rejectTarget !== null}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reject Hours</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason (optional)"
            multiline
            rows={2}
            fullWidth
            sx={{ mt: 1 }}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectTarget(null);
              setRejectReason("");
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleRejectConfirm()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Hours Confirm */}
      <ConfirmDialog
        open={hoursDeleteTargetId !== null}
        title="Delete Hours Entry"
        message="Are you sure you want to delete this hours entry? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDeleteHoursConfirm}
        onClose={() => setHoursDeleteTargetId(null)}
      />
    </Stack>
  );
}
