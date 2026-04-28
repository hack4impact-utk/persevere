"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import {
  Box,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { JSX } from "react";

import { getHoursStatusLabel, LoadingSkeleton } from "@/components/ui";
import type { VolunteerHourEntry } from "@/hooks/use-volunteer-hours";

function hoursStatusChipColor(
  status: string,
): "success" | "warning" | "error" | "default" {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  if (status === "pending" || status === "edit_requested") return "warning";
  return "default";
}

type Props = {
  hours: VolunteerHourEntry[];
  loading: boolean;
  onViewDetail: (entry: VolunteerHourEntry) => void;
};

export default function VolunteerHoursTable({
  hours,
  loading,
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
      <Box sx={{ pt: 2.5, px: 3, pb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <AccessTimeIcon sx={{ color: "primary.main", fontSize: "1.25rem" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Recent Activity
          </Typography>
        </Box>
        <Divider />
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
              <TableRow sx={{ bgcolor: "#fafafa" }}>
                <TableCell sx={{ pl: 3 }}>Opportunity</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hours.map((entry) => (
                <TableRow
                  key={entry.id}
                  onClick={() => onViewDetail(entry)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "rgba(50,123,247,.04)" },
                  }}
                >
                  <TableCell sx={{ pl: 3, fontWeight: 500 }}>
                    {entry.opportunityTitle ?? "Unknown Opportunity"}
                  </TableCell>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                  >
                    {entry.hours.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Chip
                        label={getHoursStatusLabel(entry.status)}
                        color={hoursStatusChipColor(entry.status)}
                        variant="outlined"
                        size="small"
                      />
                      {entry.status === "rejected" && entry.rejectionReason && (
                        <Typography variant="caption" color="error">
                          {entry.rejectionReason}
                        </Typography>
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
