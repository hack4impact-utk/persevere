"use client";

import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  Card,
  Chip,
  type ChipProps,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { type ReactElement, useCallback } from "react";

import { ResponsiveTable, TablePaginationFooter } from "@/components/shared";
import { EmptyState } from "@/components/ui";

import { type Volunteer } from "./types";

type VolunteerStatus = "Active" | "Onboarding" | "Pending" | "Inactive";

const STATUS_COLOR: Record<VolunteerStatus, ChipProps["color"]> = {
  Active: "success",
  Onboarding: "warning",
  Pending: "primary",
  Inactive: "default",
};

function deriveStatus(v: Volunteer): VolunteerStatus {
  if (!v.isEmailVerified) return "Pending";
  if (!v.isActive) return "Inactive";
  if (v.completionPercentage < 100) return "Onboarding";
  return "Active";
}

function fmtJoined(d: Date): string {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });
}

type VolunteerTableProps = {
  volunteers: Volunteer[];
  totalVolunteers: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onVolunteerClick: (volunteerId: number) => void;
  loading?: boolean;
};

export default function VolunteerTable({
  volunteers,
  totalVolunteers,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onVolunteerClick,
  loading = false,
}: VolunteerTableProps): ReactElement {
  const handleRowClick = useCallback(
    (volunteerId: number): void => {
      onVolunteerClick(volunteerId);
    },
    [onVolunteerClick],
  );

  return (
    <Paper
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <ResponsiveTable
        desktop={
          <TableContainer
            sx={{ flex: 1, overflow: "auto", position: "relative" }}
          >
            {loading && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Table stickyHeader aria-label="volunteer table">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      width: "45%",
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      width: "15%",
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      width: "10%",
                    }}
                  >
                    Hours
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      width: "15%",
                    }}
                  >
                    Joined
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {volunteers.length > 0 ? (
                  volunteers.map((volunteer) => {
                    const status = deriveStatus(volunteer);
                    return (
                      <TableRow
                        key={volunteer.id}
                        onClick={() => handleRowClick(volunteer.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRowClick(volunteer.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View profile for ${volunteer.firstName} ${volunteer.lastName}`}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "action.hover" },
                        }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Avatar
                              src={volunteer.profilePicture || undefined}
                              alt={`${volunteer.firstName} ${volunteer.lastName}`}
                              sx={{ width: 32, height: 32 }}
                            >
                              {!volunteer.profilePicture && (
                                <PersonIcon sx={{ fontSize: 18 }} />
                              )}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: "text.primary",
                                  lineHeight: 1.3,
                                }}
                              >
                                {volunteer.firstName} {volunteer.lastName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {volunteer.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status}
                            color={STATUS_COLOR[status]}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              fontVariantNumeric: "tabular-nums",
                              fontWeight: 500,
                            }}
                          >
                            {(volunteer.totalHours ?? 0).toFixed(1)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {fmtJoined(volunteer.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : loading ? null : (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyState message="No volunteers found" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        }
        mobile={
          <Box sx={{ flex: 1, overflow: "auto", position: "relative" }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 6,
                }}
              >
                <CircularProgress />
              </Box>
            ) : volunteers.length === 0 ? (
              <EmptyState message="No volunteers found" />
            ) : (
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}
              >
                {volunteers.map((volunteer) => {
                  const status = deriveStatus(volunteer);
                  return (
                    <Card
                      key={volunteer.id}
                      variant="outlined"
                      onClick={() => handleRowClick(volunteer.id)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          p: 1.5,
                          gap: 1.5,
                        }}
                      >
                        <Avatar
                          src={volunteer.profilePicture || undefined}
                          alt={`${volunteer.firstName} ${volunteer.lastName}`}
                          sx={{ width: 40, height: 40, flexShrink: 0 }}
                        >
                          {!volunteer.profilePicture && <PersonIcon />}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {volunteer.firstName} {volunteer.lastName}
                            </Typography>
                            <Chip
                              label={status}
                              color={STATUS_COLOR[status]}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                          >
                            {volunteer.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(volunteer.totalHours ?? 0).toFixed(1)} hrs ·{" "}
                            {fmtJoined(volunteer.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>
        }
      />
      <TablePaginationFooter
        total={totalVolunteers}
        page={page}
        limit={limit}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </Paper>
  );
}
