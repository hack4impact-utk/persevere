"use client";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DoNotDisturbIcon from "@mui/icons-material/DoNotDisturb";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { JSX } from "react";

import { ModalTitleBar } from "@/components/shared";
import { StatusBadge } from "@/components/ui";
import type {
  AttendanceEvent,
  AttendanceRsvp,
} from "@/hooks/use-approvals-attendance";

// Only declined RSVPs cannot be updated — attended/no_show can toggle between each other
function isLocked(status: string): boolean {
  return status === "declined";
}

type AttendanceModalProps = {
  open: boolean;
  event: AttendanceEvent | null;
  rsvps: AttendanceRsvp[];
  loading: boolean;
  mutating: boolean;
  onClose: () => void;
  onMark: (
    volunteerId: number,
    opportunityId: number,
    status: "attended" | "no_show",
  ) => Promise<boolean>;
};

const RSVP_STATUS_COLORS: Record<
  string,
  "default" | "warning" | "success" | "error" | "primary"
> = {
  pending: "warning",
  confirmed: "primary",
  attended: "success",
  no_show: "error",
  declined: "default",
};

export default function AttendanceModal({
  open,
  event,
  rsvps,
  loading,
  mutating,
  onClose,
  onMark,
}: AttendanceModalProps): JSX.Element {
  if (!event) return <></>;

  const eventDate = new Date(event.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <ModalTitleBar
        title={
          <>
            {event.title}
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1, fontWeight: 400 }}
            >
              — {eventDate}
            </Typography>
          </>
        }
        onClose={onClose}
      />
      <DialogContent sx={{ px: 3, pb: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : rsvps.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ py: 3, textAlign: "center" }}
          >
            No RSVPs found for this event.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Volunteer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>RSVP Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Mark Attendance
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rsvps.map((rsvp) => {
                const locked = isLocked(rsvp.rsvpStatus);
                return (
                  <TableRow key={rsvp.volunteerId}>
                    <TableCell>
                      {rsvp.firstName} {rsvp.lastName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={rsvp.rsvpStatus}
                        color={RSVP_STATUS_COLORS[rsvp.rsvpStatus] ?? "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button
                          size="small"
                          variant={
                            rsvp.rsvpStatus === "attended"
                              ? "contained"
                              : "outlined"
                          }
                          color="success"
                          startIcon={<CheckCircleOutlineIcon />}
                          disabled={locked || mutating}
                          onClick={() =>
                            void onMark(rsvp.volunteerId, event.id, "attended")
                          }
                        >
                          Attended
                        </Button>
                        <Button
                          size="small"
                          variant={
                            rsvp.rsvpStatus === "no_show"
                              ? "contained"
                              : "outlined"
                          }
                          color="error"
                          startIcon={<DoNotDisturbIcon />}
                          disabled={locked || mutating}
                          onClick={() =>
                            void onMark(rsvp.volunteerId, event.id, "no_show")
                          }
                        >
                          No Show
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
