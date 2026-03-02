"use client";

import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
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

import { TablePaginationFooter } from "@/components/shared";
import { EmptyState } from "@/components/ui";

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
          maxHeight: "calc(100vh - 300px)",
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
                }}
              >
                Name
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Role
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Hours
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Contact
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {volunteers && volunteers.length > 0 ? (
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
                      <Box>
                        {volunteer.firstName} {volunteer.lastName}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{volunteer.volunteerType || "N/A"}</TableCell>
                  <TableCell>
                    {volunteer.totalHours?.toFixed(1) || "0.0"}
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
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
