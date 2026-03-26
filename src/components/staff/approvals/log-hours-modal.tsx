"use client";

import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  TextField,
} from "@mui/material";
import { JSX, useCallback, useEffect, useState } from "react";

import { ModalTitleBar } from "@/components/shared";
import type { LogHoursInput } from "@/hooks/use-approvals-hours";
import { apiClient } from "@/lib/api-client";

type VolunteerOption = {
  id: number;
  label: string;
};

type EventOption = {
  id: number;
  title: string;
};

type LogHoursModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: LogHoursInput) => Promise<boolean>;
  submitting: boolean;
};

export default function LogHoursModal({
  open,
  onClose,
  onSubmit,
  submitting,
}: LogHoursModalProps): JSX.Element {
  const [volunteers, setVolunteers] = useState<VolunteerOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [selectedVolunteer, setSelectedVolunteer] =
    useState<VolunteerOption | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    type APIVolRow = {
      volunteers: { id: number };
      users: { firstName: string; lastName: string };
    };
    Promise.all([
      apiClient.get<{ data: APIVolRow[]; total: number }>(
        "/api/staff/volunteers?page=1&limit=200&isActive=true",
      ),
      apiClient.get<{ data: { id: string; title: string }[] }>(
        "/api/staff/calendar/events",
      ),
    ])
      .then(([volRes, evtRes]) => {
        setVolunteers(
          volRes.data.map((row) => ({
            id: row.volunteers.id,
            label: `${row.users.firstName} ${row.users.lastName}`.trim(),
          })),
        );
        setEvents(
          evtRes.data.map((e) => ({
            id: Number(e.id),
            title: e.title,
          })),
        );
      })
      .catch(() => {
        // silently fail — fields will just remain empty
      })
      .finally(() => setLoadingOptions(false));
  }, [open]);

  const reset = useCallback(() => {
    setSelectedVolunteer(null);
    setSelectedEventId("");
    setDate("");
    setHours("");
    setNotes("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = useCallback(async () => {
    if (!selectedVolunteer || !selectedEventId || !date || !hours) return;
    const ok = await onSubmit({
      volunteerId: selectedVolunteer.id,
      opportunityId: Number(selectedEventId),
      date,
      hours: Number(hours),
      notes: notes || undefined,
    });
    if (ok) handleClose();
  }, [
    selectedVolunteer,
    selectedEventId,
    date,
    hours,
    notes,
    onSubmit,
    handleClose,
  ]);

  const isValid =
    selectedVolunteer !== null &&
    selectedEventId !== "" &&
    date !== "" &&
    Number(hours) > 0 &&
    Number(hours) <= 24;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <ModalTitleBar title="Log Hours for Volunteer" onClose={handleClose} />
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Autocomplete
            options={volunteers}
            loading={loadingOptions}
            value={selectedVolunteer}
            onChange={(_, val) => setSelectedVolunteer(val)}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Volunteer"
                required
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingOptions && (
                          <CircularProgress color="inherit" size={16} />
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
          <TextField
            select
            label="Event / Opportunity"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            required
            disabled={loadingOptions}
          >
            {events.map((evt) => (
              <MenuItem key={evt.id} value={evt.id}>
                {evt.title}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Hours"
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
            slotProps={{ htmlInput: { min: 0.5, max: 24, step: 0.5 } }}
            helperText="Between 0.5 and 24"
          />
          <TextField
            label="Notes (optional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
        >
          {submitting ? <CircularProgress size={20} /> : "Log Hours"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
