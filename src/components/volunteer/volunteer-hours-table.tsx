"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import {
  Box,
  ButtonBase,
  Card,
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

import { ResponsiveTable } from "@/components/shared";
import {
  getHoursStatusColor,
  getHoursStatusLabel,
  LoadingSkeleton,
} from "@/components/ui";
import type { VolunteerHourEntry } from "@/hooks/use-volunteer-hours";

type Props = {
  hours: VolunteerHourEntry[];
  loading: boolean;
  onViewDetail: (entry: VolunteerHourEntry) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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
      <Box sx={{ pt: 2.5, px: { xs: 2, md: 3 }, pb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <AccessTimeIcon sx={{ color: "primary.main", fontSize: "1.25rem" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Recent Activity
          </Typography>
        </Box>
        <Divider />
      </Box>

      {hours.length === 0 ? (
        <Box sx={{ px: { xs: 2, md: 3 }, pb: 3, pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No hours logged yet.
          </Typography>
        </Box>
      ) : (
        <ResponsiveTable
          desktop={
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
                        {entry.opportunityTitle ?? "None"}
                      </TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {entry.hours.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Chip
                            label={getHoursStatusLabel(entry.status)}
                            color={getHoursStatusColor(entry.status)}
                            variant="outlined"
                            size="small"
                          />
                          {entry.status === "rejected" &&
                            entry.rejectionReason && (
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
          }
          mobile={
            <Stack spacing={1.5} sx={{ px: 2, pt: 2, pb: 3 }}>
              {hours.map((entry) => (
                <ButtonBase
                  key={entry.id}
                  onClick={() => onViewDetail(entry)}
                  sx={{
                    display: "block",
                    textAlign: "left",
                    width: "100%",
                    borderRadius: 2,
                  }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      p: 2,
                      "&:hover": { borderColor: "primary.main" },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 1,
                        mb: 0.75,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, lineHeight: 1.3 }}
                      >
                        {entry.opportunityTitle ?? "None"}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "primary.main",
                          fontVariantNumeric: "tabular-nums",
                          flexShrink: 0,
                        }}
                      >
                        {entry.hours.toFixed(2)} hr
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(entry.date)}
                      </Typography>
                      <Chip
                        label={getHoursStatusLabel(entry.status)}
                        color={getHoursStatusColor(entry.status)}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    {entry.status === "rejected" && entry.rejectionReason && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        {entry.rejectionReason}
                      </Typography>
                    )}
                  </Card>
                </ButtonBase>
              ))}
            </Stack>
          }
        />
      )}
    </Box>
  );
}
