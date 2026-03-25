"use client";

import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  CircularProgress,
  LinearProgress,
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

import { TablePaginationFooter } from "@/components/shared";
import { EmptyState, StatusBadge } from "@/components/ui";

import { type Volunteer } from "./types";

/**
 * VolunteerTable
 *
 * Displays volunteers in a paginated table. Rows are clickable and trigger
 * the onVolunteerClick callback to open the volunteer profile modal.
 */
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
      <TableContainer
        sx={{
          flex: 1,
          overflow: "auto",
          position: "relative",
        }}
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
                  width: "40%",
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
                Role
              </TableCell>
              <TableCell
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
                Contact
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  width: "20%",
                  minWidth: 160,
                }}
              >
                Onboarding
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {volunteers.length > 0 ? (
              volunteers.map((volunteer) => (
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
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
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
                        sx={{ width: 40, height: 40 }}
                      >
                        {!volunteer.profilePicture && <PersonIcon />}
                      </Avatar>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Box>
                          {volunteer.firstName} {volunteer.lastName}
                        </Box>
                        {volunteer.isAlumni && (
                          <StatusBadge
                            label="Alumni"
                            color="secondary"
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{volunteer.volunteerType || "N/A"}</TableCell>
                  <TableCell>
                    {volunteer.totalHours?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="body2">{volunteer.email}</Typography>
                      {volunteer.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {volunteer.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={volunteer.completionPercentage || 0}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        color={
                          volunteer.completionPercentage === 100
                            ? "success"
                            : "primary"
                        }
                      />
                      <Typography variant="caption" sx={{ minWidth: 32 }}>
                        {volunteer.completionPercentage || 0}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : loading ? null : (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState message="No volunteers found" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
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
