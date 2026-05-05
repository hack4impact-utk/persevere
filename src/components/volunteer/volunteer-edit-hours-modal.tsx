"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  InputAdornment,
  TextField,
} from "@mui/material";
import { JSX, useEffect, useState } from "react";

import { MobileDialog, ModalTitleBar } from "@/components/shared";
import type {
  EditHoursInput,
  VolunteerHourEntry,
} from "@/hooks/use-volunteer-hours";

type Props = {
  open: boolean;
  entry: VolunteerHourEntry | null;
  onClose: () => void;
  onSuccess: () => void;
  editHours: (
    hoursId: number,
    input: EditHoursInput,
  ) => Promise<VolunteerHourEntry | null>;
  isMutating: boolean;
};

export default function VolunteerEditHoursModal({
  open,
  entry,
  onClose,
  onSuccess,
  editHours,
  isMutating,
}: Props): JSX.Element {
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  useEffect(() => {
    if (entry) {
      setDate(new Date(entry.date).toISOString().split("T")[0] ?? "");
      setHours(String(entry.hours));
      setNotes(entry.notes ?? "");
      setFormError(null);
    }
  }, [entry]);

  const today = new Date().toISOString().split("T")[0];
  const editAlertMessage =
    entry?.status === "approved"
      ? "Editing will submit an edit request for staff to review."
      : entry?.status === "edit_requested"
        ? "You already have a pending edit request. Saving will update it."
        : entry?.status === "rejected"
          ? "Editing will resubmit these hours for staff review."
          : null;

  const handleSubmit = async (): Promise<void> => {
    if (!entry) return;
    setFormError(null);
    const parsedHours = Number.parseFloat(hours);

    if (!date) {
      setFormError("Please select a date.");
      return;
    }
    if (
      !hours ||
      Number.isNaN(parsedHours) ||
      parsedHours <= 0 ||
      parsedHours > 24
    ) {
      setFormError("Hours must be between 0 and 24.");
      return;
    }

    const result = await editHours(entry.id, {
      date,
      hours: parsedHours,
      notes: notes.trim() || undefined,
    });

    if (result) {
      onSuccess();
    }
  };

  const handleClose = (): void => {
    setFormError(null);
    onClose();
  };

  return (
    <MobileDialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <ModalTitleBar title="Edit Hours Entry" onClose={handleClose} />
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {editAlertMessage && (
            <Alert severity="info">{editAlertMessage}</Alert>
          )}
          {formError && <Alert severity="error">{formError}</Alert>}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              disabled={isMutating}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: today },
              }}
            />
            <TextField
              label="Hours"
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              fullWidth
              disabled={isMutating}
              slotProps={{
                htmlInput: { min: 0.25, max: 24, step: 0.25 },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">hrs</InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <TextField
            label="Notes (optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            disabled={isMutating}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2,
          position: { xs: "sticky", sm: "static" },
          bottom: 0,
          bgcolor: "background.paper",
          borderTop: { xs: 1, sm: 0 },
          borderColor: "divider",
        }}
      >
        <Button onClick={handleClose} disabled={isMutating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={isMutating}
          startIcon={isMutating ? <CircularProgress size={16} /> : undefined}
        >
          {isMutating ? "Saving…" : "Save Changes"}
        </Button>
      </DialogActions>
    </MobileDialog>
  );
}
