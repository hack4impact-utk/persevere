"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import { useRsvpMutation } from "@/hooks/use-rsvp-mutation";

type RsvpButtonProps = {
  opportunityId: number;
  isRsvped: boolean;
  isFull: boolean;
  onRsvpChange?: (newIsRsvped: boolean) => void;
};

export default function RsvpButton({
  opportunityId,
  isRsvped,
  isFull,
  onRsvpChange,
}: RsvpButtonProps): React.JSX.Element {
  const { toggleRsvp, isMutating } = useRsvpMutation();

  const handleClick = async (): Promise<void> => {
    const success = await toggleRsvp(opportunityId, isRsvped);
    if (success) {
      onRsvpChange?.(!isRsvped);
    }
  };

  if (isFull && !isRsvped) {
    return (
      <Button variant="outlined" disabled fullWidth>
        Full
      </Button>
    );
  }

  return (
    <Button
      variant={isRsvped ? "outlined" : "contained"}
      color={isRsvped ? "error" : "primary"}
      onClick={() => {
        void handleClick();
      }}
      disabled={isMutating}
      fullWidth
      startIcon={
        isMutating ? <CircularProgress size={16} color="inherit" /> : undefined
      }
    >
      {isMutating
        ? isRsvped
          ? "Cancelling..."
          : "RSVPing..."
        : isRsvped
          ? "Cancel RSVP"
          : "RSVP"}
    </Button>
  );
}
