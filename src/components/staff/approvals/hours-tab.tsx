"use client";

import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useState } from "react";

import { ConfirmDialog } from "@/components/shared";
import { EmptyState } from "@/components/ui";
import type { ApprovalsHoursRecord } from "@/hooks/use-approvals-hours";

type HoursTabProps = {
  hours: ApprovalsHoursRecord[];
  loading: boolean;
  mutating: boolean;
  onApprove: (id: number) => Promise<boolean>;
  onReject: (id: number, reason?: string) => Promise<boolean>;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts.at(-1)![0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function HoursTab({
  hours,
  loading,
  mutating,
  onApprove,
  onReject,
}: HoursTabProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = useCallback(
    async (id: number) => {
      const ok = await onApprove(id);
      if (ok) enqueueSnackbar("Hours approved", { variant: "success" });
      else enqueueSnackbar("Failed to approve hours", { variant: "error" });
    },
    [onApprove, enqueueSnackbar],
  );

  const handleRejectConfirm = useCallback(async () => {
    if (rejectTarget === null) return;
    const ok = await onReject(rejectTarget, rejectReason || undefined);
    if (ok) {
      enqueueSnackbar("Hours rejected", { variant: "info" });
      setRejectTarget(null);
      setRejectReason("");
    }
  }, [rejectTarget, rejectReason, onReject, enqueueSnackbar]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {hours.length === 0 ? (
        <EmptyState
          message="No pending hours"
          subMessage="All volunteer hour submissions have been reviewed."
        />
      ) : (
        hours.map((row) => {
          const hoursDisplay =
            row.previousHours == null
              ? `${row.hours}h`
              : `${row.previousHours}h → ${row.hours}h`;
          const dateDisplay = new Date(row.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <Paper key={row.id} elevation={1} sx={{ p: 2.5, mb: 1.5 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: "primary.main",
                    fontSize: "0.875rem",
                  }}
                >
                  {getInitials(row.volunteerName)}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontWeight: 600, fontSize: "0.9375rem", mb: 0.5 }}
                  >
                    {row.volunteerName}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: row.notes ? 0.75 : 0 }}>
                    <Box
                      component="span"
                      sx={{ color: "primary.main", fontWeight: 600 }}
                    >
                      {hoursDisplay}
                    </Box>
                    {row.opportunityTitle ? ` · ${row.opportunityTitle}` : ""}
                    {" · "}
                    <Box component="span" sx={{ color: "text.secondary" }}>
                      {dateDisplay}
                    </Box>
                  </Typography>
                  {row.notes && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8125rem", lineHeight: 1.4 }}
                    >
                      {row.notes}
                    </Typography>
                  )}
                </Box>

                <Stack direction="row" spacing={1} flexShrink={0}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={mutating}
                    onClick={() => setRejectTarget(row.id)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={mutating}
                    onClick={() => void handleApprove(row.id)}
                  >
                    Approve
                  </Button>
                </Stack>
              </Box>
            </Paper>
          );
        })
      )}

      <ConfirmDialog
        open={rejectTarget !== null}
        title="Reject Hours"
        message={
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2">
              Are you sure you want to reject these hours? You can optionally
              provide a reason.
            </Typography>
            <TextField
              label="Reason (optional)"
              multiline
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              size="small"
            />
          </Box>
        }
        confirmLabel="Reject"
        confirmColor="error"
        loading={mutating}
        onConfirm={handleRejectConfirm}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
      />
    </>
  );
}
