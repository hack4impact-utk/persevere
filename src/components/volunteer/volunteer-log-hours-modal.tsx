"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { JSX, useState } from "react";

import { MobileDialog, ModalTitleBar } from "@/components/shared";
import type { RsvpItem } from "@/components/volunteer/types";
import type { LogHoursInput } from "@/hooks/use-volunteer-hours";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  logHours: (input: LogHoursInput) => Promise<unknown>;
  isMutating: boolean;
  pastOptions: RsvpItem[];
  optionsLoading: boolean;
};

export default function VolunteerLogHoursModal({
  open,
  onClose,
  onSuccess,
  logHours,
  isMutating,
  pastOptions,
  optionsLoading,
}: Props): JSX.Element {
  const [opportunityId, setOpportunityId] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (): Promise<void> => {
    setFormError(null);
    const parsedOpportunityId = Number.parseInt(opportunityId, 10);
    const parsedHours = Number.parseFloat(hours);

    if (!opportunityId || Number.isNaN(parsedOpportunityId)) {
      setFormError("Please select an opportunity.");
      return;
    }
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

    const result = await logHours({
      opportunityId: parsedOpportunityId,
      date,
      hours: parsedHours,
      notes: notes.trim() || undefined,
    });

    if (result) {
      setOpportunityId("");
      setDate("");
      setHours("");
      setNotes("");
      onSuccess();
    }
  };

  const handleClose = (): void => {
    setOpportunityId("");
    setDate("");
    setHours("");
    setNotes("");
    setFormError(null);
    onClose();
  };

  return (
    <MobileDialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <ModalTitleBar title="Log New Hours" onClose={handleClose} />
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              mb: -1,
            }}
          >
            Activity Details
          </Typography>

          <TextField
            select
            label="Opportunity"
            value={opportunityId}
            onChange={(e) => setOpportunityId(e.target.value)}
            fullWidth
            disabled={optionsLoading || isMutating}
          >
            {optionsLoading ? (
              <MenuItem disabled>Loading…</MenuItem>
            ) : pastOptions.length === 0 ? (
              <MenuItem disabled>No eligible past events found</MenuItem>
            ) : (
              pastOptions.map((r) => (
                <MenuItem key={r.opportunityId} value={String(r.opportunityId)}>
                  {r.opportunityTitle ?? `Opportunity #${r.opportunityId}`}
                </MenuItem>
              ))
            )}
          </TextField>

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

          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              mb: -1,
              mt: 1,
            }}
          >
            Notes
          </Typography>

          <TextField
            label="What did you do? (optional)"
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
          paddingBottom: {
            xs: "max(16px, env(safe-area-inset-bottom, 0px))",
            sm: 2,
          },
        }}
      >
        <Button onClick={handleClose} disabled={isMutating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={isMutating || optionsLoading}
          startIcon={isMutating ? <CircularProgress size={16} /> : undefined}
        >
          {isMutating ? "Submitting…" : "Submit Hours"}
        </Button>
      </DialogActions>
    </MobileDialog>
  );
}
