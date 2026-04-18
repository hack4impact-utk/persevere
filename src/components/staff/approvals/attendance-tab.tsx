"use client";

import EventNoteIcon from "@mui/icons-material/EventNote";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { JSX, useCallback, useState } from "react";

import { EmptyState, StatusBadge } from "@/components/ui";
import type {
  AttendanceEvent,
  AttendanceRsvp,
} from "@/hooks/use-approvals-attendance";

import AttendanceModal from "./attendance-modal";

type AttendanceTabProps = {
  events: AttendanceEvent[];
  loading: boolean;
  eventRsvps: AttendanceRsvp[];
  loadingRsvps: boolean;
  mutating: boolean;
  onLoadEventRsvps: (eventId: number) => Promise<void>;
  onMark: (
    volunteerId: number,
    opportunityId: number,
    status: "attended" | "no_show" | "confirmed" | "cancelled",
  ) => Promise<boolean>;
};

const EVENT_STATUS_COLORS: Record<
  string,
  "default" | "warning" | "success" | "error" | "primary"
> = {
  open: "primary",
  full: "warning",
  completed: "success",
  canceled: "error",
};

function EventTable({
  events,
  onOpen,
}: {
  events: AttendanceEvent[];
  onOpen: (event: AttendanceEvent) => void;
}): JSX.Element {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
          <TableCell sx={{ fontWeight: 600 }} align="right">
            Actions
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id} hover>
            <TableCell>
              <Typography variant="body2" fontWeight={500}>
                {event.title}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {new Date(event.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Typography>
            </TableCell>
            <TableCell>
              <StatusBadge
                label={event.status}
                color={EVENT_STATUS_COLORS[event.status] ?? "default"}
              />
            </TableCell>
            <TableCell align="right">
              <Button
                size="small"
                variant="outlined"
                startIcon={<EventNoteIcon />}
                onClick={() => onOpen(event)}
              >
                Mark Attendance
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AttendanceTab({
  events,
  loading,
  eventRsvps,
  loadingRsvps,
  mutating,
  onLoadEventRsvps,
  onMark,
}: AttendanceTabProps): JSX.Element {
  const [selectedEvent, setSelectedEvent] = useState<AttendanceEvent | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenAttendance = useCallback(
    async (event: AttendanceEvent) => {
      setSelectedEvent(event);
      setModalOpen(true);
      await onLoadEventRsvps(event.id);
    },
    [onLoadEventRsvps],
  );

  const handleClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const needsAttention = events.filter((e) => e.confirmedCount > 0);
  const completed = events.filter(
    (e) =>
      e.confirmedCount === 0 &&
      (e.status === "completed" || e.status === "canceled"),
  );

  return (
    <>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <EmptyState
          message="No events found"
          subMessage="Create opportunities first to manage attendance."
        />
      ) : (
        <Box>
          {needsAttention.length > 0 && (
            <>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                color="text.secondary"
                sx={{ mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Needs Attention ({needsAttention.length})
              </Typography>
              <EventTable
                events={needsAttention}
                onOpen={handleOpenAttendance}
              />
            </>
          )}

          {needsAttention.length > 0 && completed.length > 0 && (
            <Divider sx={{ my: 3 }} />
          )}

          {completed.length > 0 && (
            <>
              {needsAttention.length > 0 && (
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="text.disabled"
                  sx={{ mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  Completed ({completed.length})
                </Typography>
              )}
              <Box sx={{ opacity: needsAttention.length > 0 ? 0.7 : 1 }}>
                <EventTable events={completed} onOpen={handleOpenAttendance} />
              </Box>
            </>
          )}
        </Box>
      )}

      <AttendanceModal
        open={modalOpen}
        event={selectedEvent}
        rsvps={eventRsvps}
        loading={loadingRsvps}
        mutating={mutating}
        onClose={handleClose}
        onMark={onMark}
      />
    </>
  );
}
