"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { JSX } from "react";

import {
  getHoursStatusColor,
  LoadingSkeleton,
  StatusBadge,
} from "@/components/ui";
import type { VolunteerHourEntry } from "@/hooks/use-volunteer-hours";

type Props = {
  hours: VolunteerHourEntry[];
  loading: boolean;
  onDelete: (hoursId: number) => Promise<boolean>;
};

export default function VolunteerHoursTable({
  hours,
  loading,
  onDelete,
}: Props): JSX.Element {
  if (loading) return <LoadingSkeleton variant="lines" />;

  if (hours.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        No hours logged yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Opportunity</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Hours</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Notes</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {hours.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                {entry.opportunityTitle ?? "Unknown Opportunity"}
              </TableCell>
              <TableCell>
                {new Date(entry.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell align="right">{entry.hours.toFixed(1)}</TableCell>
              <TableCell>
                <Stack spacing={0.5} alignItems="flex-start">
                  <StatusBadge
                    label={entry.status}
                    color={getHoursStatusColor(entry.status)}
                  />
                  {entry.status === "rejected" && entry.rejectionReason && (
                    <Typography variant="caption" color="error">
                      {entry.rejectionReason}
                    </Typography>
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {entry.notes ?? "—"}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {entry.status === "pending" && (
                  <Tooltip title="Delete entry">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => void onDelete(entry.id)}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: "1rem" }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
