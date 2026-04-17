"use client";

import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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

  return (
    <>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : hours.length === 0 ? (
        <EmptyState
          message="No pending hours"
          subMessage="All volunteer hour submissions have been reviewed."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Volunteer</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Hours</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hours.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {row.volunteerName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {row.opportunityTitle ?? "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(row.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {row.hours}h
                  </Typography>
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
                    {row.notes ?? "—"}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      disabled={mutating}
                      onClick={() => void handleApprove(row.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={mutating}
                      onClick={() => setRejectTarget(row.id)}
                    >
                      Reject
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
