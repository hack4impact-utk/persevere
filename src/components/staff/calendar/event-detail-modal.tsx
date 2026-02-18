"use client";

import AutorenewIcon from "@mui/icons-material/Autorenew";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { JSX, useEffect, useState } from "react";

import type { CalendarEvent } from "@/hooks/use-calendar-events";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { useEventRsvps } from "@/hooks/use-event-rsvps";

type EventDetailModalProps = {
  event: CalendarEvent | null;
  eventId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
};

type EditFormData = {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  maxVolunteers: string;
};

type Mode = "view" | "edit";

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventDetailModal({
  event,
  eventId,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: EventDetailModalProps): JSX.Element {
  const { updateEvent, deleteEvent } = useCalendarEvents();
  const { rsvps, isLoading: rsvpsLoading, fetchRsvps } = useEventRsvps();
  const [mode, setMode] = useState<Mode>("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    title: "",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    maxVolunteers: "",
  });

  // Fetch RSVPs and reset mode when event opens
  useEffect(() => {
    if (open && eventId) {
      setMode("view");
      setShowDeleteConfirm(false);
      void fetchRsvps(eventId);
    }
  }, [open, eventId, fetchRsvps]);

  const handleEditClick = (): void => {
    if (!event) return;
    const start = new Date(event.start);
    const end = new Date(event.end);
    setEditForm({
      title: event.title,
      description: event.description ?? "",
      location: event.location ?? "",
      startDate: start.toISOString().split("T")[0],
      startTime: start.toTimeString().slice(0, 5),
      endDate: end.toISOString().split("T")[0],
      endTime: end.toTimeString().slice(0, 5),
      maxVolunteers: event.extendedProps?.maxVolunteers?.toString() ?? "",
    });
    setMode("edit");
  };

  const handleSave = async (): Promise<void> => {
    if (!event || !editForm.title.trim()) {
      enqueueSnackbar("Title is required", { variant: "error" });
      return;
    }

    const startDateTime = new Date(
      `${editForm.startDate}T${editForm.startTime}`,
    );
    const endDateTime = new Date(`${editForm.endDate}T${editForm.endTime}`);

    if (endDateTime <= startDateTime) {
      enqueueSnackbar("End date/time must be after start date/time", {
        variant: "error",
      });
      return;
    }

    try {
      await updateEvent(event.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        location: editForm.location || undefined,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        maxVolunteers: editForm.maxVolunteers
          ? Number.parseInt(editForm.maxVolunteers, 10)
          : undefined,
      });
      enqueueSnackbar("Event updated successfully", { variant: "success" });
      onUpdated();
      setMode("view");
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to update event",
        { variant: "error" },
      );
      console.error("Error updating event:", error);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!event) return;
    try {
      await deleteEvent(event.id);
      enqueueSnackbar("Event deleted successfully", { variant: "success" });
      onDeleted();
      onClose();
    } catch (error) {
      enqueueSnackbar("Failed to delete event", { variant: "error" });
      console.error("Error deleting event:", error);
    }
  };

  const isRecurring = event?.extendedProps?.isRecurring;
  const maxVol = event?.extendedProps?.maxVolunteers;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {mode === "view" ? (
        <>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1.5rem", pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {event?.title ?? ""}
              {isRecurring && (
                <AutorenewIcon
                  fontSize="small"
                  color="primary"
                  titleAccess="Recurring event"
                />
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            {event ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                  pt: 1,
                }}
              >
                {event.description && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      Description
                    </Typography>
                    <Typography>{event.description}</Typography>
                  </Box>
                )}
                {event.location && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      Location
                    </Typography>
                    <Typography>{event.location}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    Start
                  </Typography>
                  <Typography>{formatDateTime(event.start)}</Typography>
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    End
                  </Typography>
                  <Typography>{formatDateTime(event.end)}</Typography>
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    Capacity
                  </Typography>
                  <Typography>
                    {maxVol == null
                      ? "No limit"
                      : `${rsvps.length} / ${maxVol} volunteers`}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Volunteers Signed Up
                  </Typography>
                  {rsvpsLoading ? (
                    <CircularProgress size={20} />
                  ) : rsvps.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No volunteers signed up yet
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {rsvps.map((r) => (
                        <Box
                          key={r.volunteerId}
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2">
                            {r.firstName} {r.lastName}
                          </Typography>
                          <Chip label={r.rsvpStatus} size="small" />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                      mb: 0.5,
                    }}
                  >
                    Required Skills
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Skills not yet tagged
                  </Typography>
                </Box>
              </Box>
            ) : (
              <CircularProgress size={24} />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button
              onClick={onClose}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Close
            </Button>
            <Button
              onClick={handleEditClick}
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
              }}
            >
              Edit Event
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1.5rem", pb: 1 }}>
            Edit Event
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
            >
              <TextField
                label="Title"
                required
                fullWidth
                value={editForm.title}
                onChange={(e) => {
                  setEditForm({ ...editForm, title: e.target.value });
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={editForm.description}
                onChange={(e) => {
                  setEditForm({ ...editForm, description: e.target.value });
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
              <TextField
                label="Location"
                fullWidth
                value={editForm.location}
                onChange={(e) => {
                  setEditForm({ ...editForm, location: e.target.value });
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  required
                  fullWidth
                  value={editForm.startDate}
                  onChange={(e) => {
                    setEditForm({ ...editForm, startDate: e.target.value });
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
                <TextField
                  label="Start Time"
                  type="time"
                  required
                  fullWidth
                  value={editForm.startTime}
                  onChange={(e) => {
                    setEditForm({ ...editForm, startTime: e.target.value });
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="End Date"
                  type="date"
                  required
                  fullWidth
                  value={editForm.endDate}
                  onChange={(e) => {
                    setEditForm({ ...editForm, endDate: e.target.value });
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
                <TextField
                  label="End Time"
                  type="time"
                  required
                  fullWidth
                  value={editForm.endTime}
                  onChange={(e) => {
                    setEditForm({ ...editForm, endTime: e.target.value });
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>
              <TextField
                label="Max Volunteers"
                type="number"
                fullWidth
                value={editForm.maxVolunteers}
                onChange={(e) => {
                  setEditForm({ ...editForm, maxVolunteers: e.target.value });
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              {showDeleteConfirm ? (
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "error.main",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    Are you sure you want to delete &quot;{event?.title}&quot;?
                    This cannot be undone.
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                      }}
                      sx={{ textTransform: "none" }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      onClick={() => {
                        void handleDelete();
                      }}
                      sx={{ textTransform: "none" }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button
                  color="error"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                  }}
                  sx={{ alignSelf: "flex-start", textTransform: "none" }}
                >
                  Delete Event
                </Button>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
            <Button
              onClick={() => {
                setMode("view");
              }}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleSave();
              }}
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
              }}
            >
              Save
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
