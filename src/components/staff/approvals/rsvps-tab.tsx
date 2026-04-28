"use client";

import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts.at(-1)![0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {rsvps.length === 0 ? (
        <EmptyState
          message="No pending RSVPs"
          subMessage="All RSVP requests have been reviewed."
        />
      ) : (
        rsvps.map((row) => {
          const eventDate = new Date(
            row.opportunityStartDate,
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const rsvpDate = new Date(row.rsvpAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <Paper
              key={`${row.volunteerId}-${row.opportunityId}`}
              elevation={1}
              sx={{ p: 2.5, mb: 1.5 }}
            >
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
                  <Typography variant="body2" sx={{ mb: 0.25 }}>
                    {row.opportunityTitle}
                    {" · "}
                    <Box component="span" sx={{ color: "text.secondary" }}>
                      {eventDate}
                    </Box>
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8125rem" }}
                  >
                    RSVP&apos;d {rsvpDate}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexShrink={0}>
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
                  <Button
                    size="small"
                    variant="contained"
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
                </Stack>
              </Box>
            </Paper>
          );
        })
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
