"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useSnackbar } from "notistack";
import { JSX, useState } from "react";

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
}: RsvpButtonProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const handleClick = async (): Promise<void> => {
    setLoading(true);
    try {
      const method = isRsvped ? "DELETE" : "POST";
      const res = await fetch(
        `/api/volunteer/opportunities/${opportunityId}/rsvp`,
        { method },
      );

      if (!res.ok) {
        const json = (await res.json()) as { message?: string; error?: string };
        throw new Error(json.message ?? json.error ?? "Request failed");
      }

      const newIsRsvped = !isRsvped;
      enqueueSnackbar(newIsRsvped ? "RSVP confirmed!" : "RSVP cancelled.", {
        variant: newIsRsvped ? "success" : "info",
      });
      onRsvpChange?.(newIsRsvped);
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Something went wrong",
        { variant: "error" },
      );
    } finally {
      setLoading(false);
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
      disabled={loading}
      fullWidth
      startIcon={
        loading ? <CircularProgress size={16} color="inherit" /> : undefined
      }
    >
      {loading
        ? isRsvped
          ? "Cancelling..."
          : "RSVPing..."
        : isRsvped
          ? "Cancel RSVP"
          : "RSVP"}
    </Button>
  );
}
