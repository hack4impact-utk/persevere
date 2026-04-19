"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  getHoursStatusLabel,
  LoadingSkeleton,
  StatusBadge,
} from "@/components/ui";
import type { VolunteerHourEntry } from "@/hooks/use-volunteer-hours";

type Props = {
  hours: VolunteerHourEntry[];
  loading: boolean;
  onDelete: (hoursId: number) => Promise<boolean>;
  onEdit: (entry: VolunteerHourEntry) => void;
  onViewDetail: (entry: VolunteerHourEntry) => void;
};

export default function VolunteerHoursTable({
  hours,
  loading,
  onDelete,
  onEdit,
  onViewDetail,
}: Props): JSX.Element {
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LoadingSkeleton variant="lines" />
      </Box>
    );
  }

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <Box sx={{ pt: 2.5, px: 3, pb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Recent Activity
        </Typography>
      </Box>

      {hours.length === 0 ? (
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No hours logged yet.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto", flex: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3 }}>Opportunity</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center" sx={{ pr: 3 }}>
                  Manage
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hours.map((entry) => (
                <TableRow
                  key={entry.id}
                  onClick={() => onViewDetail(entry)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell sx={{ pl: 3 }}>
                    {entry.opportunityTitle ?? "Unknown Opportunity"}
                  </TableCell>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell align="right">{entry.hours.toFixed(2)}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5} alignItems="flex-start">
                      <StatusBadge
                        label={getHoursStatusLabel(entry.status)}
                        color={getHoursStatusColor(entry.status)}
                        sx={{ borderRadius: "100px" }}
                      />
                      {entry.status === "rejected" && entry.rejectionReason && (
                        <Typography variant="caption" color="error">
                          {entry.rejectionReason}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ pr: 3 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="center"
                    >
                      <Tooltip title="Edit entry">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onEdit(entry)}
                            sx={{ p: 0.5 }}
                          >
                            <EditOutlinedIcon sx={{ fontSize: "1rem" }} />
                          </IconButton>
                        </span>
                      </Tooltip>
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
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
