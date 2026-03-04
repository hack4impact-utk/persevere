"use client";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
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
import { EmptyState, StatusBadge } from "@/components/ui";

import { type Staff } from "./types";

/**
 * StaffTable
 *
 * Displays staff members in a paginated table. Rows are clickable and trigger
 * the onStaffClick callback to open the staff profile modal.
 */
type StaffTableProps = {
  staff: Staff[];
  totalStaff: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onStaffClick: (staffId: number) => void;
  loading?: boolean;
};

export default function StaffTable({
  staff,
  totalStaff,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onStaffClick,
  loading = false,
}: StaffTableProps): ReactElement {
  const handleRowClick = useCallback(
    (staffId: number): void => {
      onStaffClick(staffId);
    },
    [onStaffClick],
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
        <Table stickyHeader aria-label="staff table">
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
                Status
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
            {staff && staff.length > 0 ? (
              staff.map((staffMember) => (
                <TableRow
                  key={staffMember.id}
                  onClick={() => handleRowClick(staffMember.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(staffMember.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View profile for ${staffMember.firstName} ${staffMember.lastName}`}
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
                        src={staffMember.profilePicture || undefined}
                        alt={`${staffMember.firstName} ${staffMember.lastName}`}
                        sx={{ width: 40, height: 40 }}
                      >
                        {!staffMember.profilePicture && <PersonIcon />}
                      </Avatar>
                      <Box>
                        {staffMember.firstName} {staffMember.lastName}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {staffMember.isAdmin ? (
                      <StatusBadge
                        icon={<AdminPanelSettingsIcon />}
                        label="Admin"
                        color="primary"
                      />
                    ) : (
                      <StatusBadge label="Staff" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={staffMember.isActive ? "Active" : "Inactive"}
                      color={staffMember.isActive ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="body2">
                        {staffMember.email}
                      </Typography>
                      {staffMember.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {staffMember.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  <EmptyState message="No staff members found" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePaginationFooter
        total={totalStaff}
        page={page}
        limit={limit}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </Paper>
  );
}
