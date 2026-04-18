"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared";
import { getRsvpStatusColor, StatusBadge } from "@/components/ui";
import type { RsvpStatus } from "@/components/volunteer/types";
import { useRsvpMutation } from "@/hooks/use-rsvp-mutation";

type RsvpButtonProps = {
  opportunityId: number;
  isRsvped: boolean;
  isFull: boolean;
  rsvpStatus?: RsvpStatus;
  onRsvpChange?: (newIsRsvped: boolean) => void;
};

export default function RsvpButton({
  opportunityId,
  isRsvped,
  isFull,
  rsvpStatus,
  onRsvpChange,
}: RsvpButtonProps): React.JSX.Element {
  const { toggleRsvp, isMutating } = useRsvpMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleCancelConfirm = async (): Promise<void> => {
    setConfirmOpen(false);
    const success = await toggleRsvp(opportunityId, true);
    if (success) {
      onRsvpChange?.(false);
    }
  };

  // Terminal / read-only states
  if (rsvpStatus === "cancelled" || rsvpStatus === "declined") {
    return (
      <StatusBadge
        label={rsvpStatus}
        color={getRsvpStatusColor(rsvpStatus)}
        sx={{ width: "100%", borderRadius: 1 }}
      />
    );
  }

  // Pending: can cancel (hard delete, re-RSVP allowed), no dialog needed
  if (rsvpStatus === "pending") {
    const handlePendingCancel = async (): Promise<void> => {
      const success = await toggleRsvp(opportunityId, true);
      if (success) onRsvpChange?.(false);
    };
    return (
      <Button
        variant="outlined"
        color="error"
        onClick={() => {
          void handlePendingCancel();
        }}
        disabled={isMutating}
        fullWidth
        startIcon={
          isMutating ? (
            <CircularProgress size={16} color="inherit" />
          ) : undefined
        }
      >
        {isMutating ? "Cancelling..." : "Cancel RSVP"}
      </Button>
    );
  }

  // Confirmed: show Cancel RSVP with confirmation dialog
  if (rsvpStatus === "confirmed") {
    return (
      <>
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            setConfirmOpen(true);
          }}
          disabled={isMutating}
          fullWidth
          startIcon={
            isMutating ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {isMutating ? "Cancelling..." : "Cancel RSVP"}
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          title="Cancel RSVP?"
          message="Are you sure you want to cancel? Your RSVP has been confirmed. You will need to re-RSVP to attend this event."
          confirmLabel="Cancel RSVP"
          confirmColor="error"
          loading={isMutating}
          onConfirm={() => {
            void handleCancelConfirm();
          }}
          onClose={() => {
            setConfirmOpen(false);
          }}
        />
      </>
    );
  }

  // No RSVP yet
  if (isFull && !isRsvped) {
    return (
      <Button variant="outlined" disabled fullWidth>
        Full
      </Button>
    );
  }

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={() => {
        void (async (): Promise<void> => {
          const success = await toggleRsvp(opportunityId, false);
          if (success) {
            onRsvpChange?.(true);
          }
        })();
      }}
      disabled={isMutating}
      fullWidth
      startIcon={
        isMutating ? <CircularProgress size={16} color="inherit" /> : undefined
      }
    >
      {isMutating ? "RSVPing..." : "RSVP"}
    </Button>
  );
}
