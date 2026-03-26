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
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useState } from "react";

import { ConfirmDialog } from "@/components/shared";
import { EmptyState } from "@/components/ui";
import type { PendingRsvp } from "@/hooks/use-approvals-rsvps";

type RsvpsTabProps = {
  rsvps: PendingRsvp[];
  loading: boolean;
  mutating: boolean;
  onConfirm: (volunteerId: number, opportunityId: number) => Promise<boolean>;
  onDecline: (volunteerId: number, opportunityId: number) => Promise<boolean>;
};

type RsvpTarget = { volunteerId: number; opportunityId: number } | null;

export default function RsvpsTab({
  rsvps,
  loading,
  mutating,
  onConfirm,
  onDecline,
}: RsvpsTabProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const [confirmTarget, setConfirmTarget] = useState<RsvpTarget>(null);
  const [declineTarget, setDeclineTarget] = useState<RsvpTarget>(null);

  const handleConfirm = useCallback(async () => {
    if (!confirmTarget) return;
    const ok = await onConfirm(
      confirmTarget.volunteerId,
      confirmTarget.opportunityId,
    );
    if (ok) {
      enqueueSnackbar("RSVP confirmed", { variant: "success" });
      setConfirmTarget(null);
    }
  }, [confirmTarget, onConfirm, enqueueSnackbar]);

  const handleDecline = useCallback(async () => {
    if (!declineTarget) return;
    const ok = await onDecline(
      declineTarget.volunteerId,
      declineTarget.opportunityId,
    );
    if (ok) {
      enqueueSnackbar("RSVP declined", { variant: "info" });
      setDeclineTarget(null);
    }
  }, [declineTarget, onDecline, enqueueSnackbar]);

  return (
    <>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : rsvps.length === 0 ? (
        <EmptyState
          message="No pending RSVPs"
          subMessage="All RSVP requests have been reviewed."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Volunteer</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Event Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>RSVP'd At</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rsvps.map((row) => (
              <TableRow key={`${row.volunteerId}-${row.opportunityId}`} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {row.volunteerName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {row.opportunityTitle}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(row.opportunityStartDate).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(row.rsvpAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      disabled={mutating}
                      onClick={() =>
                        setConfirmTarget({
                          volunteerId: row.volunteerId,
                          opportunityId: row.opportunityId,
                        })
                      }
                    >
                      Confirm
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={mutating}
                      onClick={() =>
                        setDeclineTarget({
                          volunteerId: row.volunteerId,
                          opportunityId: row.opportunityId,
                        })
                      }
                    >
                      Decline
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Confirm RSVP"
        message="Confirm this volunteer's RSVP for the event?"
        confirmLabel="Confirm"
        confirmColor="primary"
        loading={mutating}
        onConfirm={handleConfirm}
        onClose={() => setConfirmTarget(null)}
      />

      <ConfirmDialog
        open={declineTarget !== null}
        title="Decline RSVP"
        message="Decline this volunteer's RSVP? They will not be listed as attending."
        confirmLabel="Decline"
        confirmColor="error"
        loading={mutating}
        onConfirm={handleDecline}
        onClose={() => setDeclineTarget(null)}
      />
    </>
  );
}
