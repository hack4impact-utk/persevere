"use client";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { type ReactElement, useCallback, useState } from "react";

import { TablePaginationFooter } from "@/components/shared";
import { EmptyState, StatusBadge } from "@/components/ui";
import { getHoursStatusColor } from "@/components/ui/status-badge";
import { useStaffHoursReview } from "@/hooks/use-staff-hours-review";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

/**
 * HoursReviewList
 *
 * Displays all volunteer hours for staff review. Features:
 * - Filter tabs: All | Pending | Verified
 * - Search by volunteer name or opportunity title
 * - Approve/reject actions per row
 * - Pagination
 */
export default function HoursReviewList(): ReactElement {
  const {
    hours,
    loading,
    isMutating,
    error,
    total,
    page,
    limit,
    status,
    search,
    setPage,
    setLimit,
    setStatus,
    setSearch,
    approveHours,
    rejectHours,
  } = useStaffHoursReview();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number): void => {
      const statuses: ("all" | "pending" | "verified")[] = [
        "all",
        "pending",
        "verified",
      ];
      setStatus(statuses[newValue]);
      setPage(1);
    },
    [setStatus, setPage],
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setSearch(event.target.value);
    },
    [setSearch],
  );

  const handleApprove = useCallback(
    async (id: number): Promise<void> => {
      await approveHours(id);
    },
    [approveHours],
  );

  const handleRejectClick = useCallback((id: number): void => {
    setRejectingId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  }, []);

  const handleRejectConfirm = useCallback(async (): Promise<void> => {
    if (rejectingId === null) return;
    await rejectHours(rejectingId, rejectReason || undefined);
    setRejectDialogOpen(false);
    setRejectingId(null);
    setRejectReason("");
  }, [rejectingId, rejectReason, rejectHours]);

  const handleRejectCancel = useCallback((): void => {
    setRejectDialogOpen(false);
    setRejectingId(null);
    setRejectReason("");
  }, []);

  const handlePageChange = useCallback(
    (newPage: number): void => {
      setPage(newPage);
    },
    [setPage],
  );

  const handleLimitChange = useCallback(
    (newLimit: number): void => {
      setLimit(newLimit);
      setPage(1);
    },
    [setLimit, setPage],
  );

  const getTabValue = useCallback((): number => {
    if (status === "pending") return 1;
    if (status === "verified") return 2;
    return 0;
  }, [status]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: { xs: 2, md: 4 },
        overflow: "hidden",
      }}
    >
      {error && (
        <Box sx={{ mb: 3, flexShrink: 0 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            gap: 2,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <Tabs
            value={getTabValue()}
            onChange={handleTabChange}
            aria-label="hours review tabs"
            sx={{ flex: 1, minWidth: 0 }}
          >
            <Tab label="All" />
            <Tab label="Pending" />
            <Tab label="Verified" />
          </Tabs>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <TextField
              size="small"
              label="Search"
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by volunteer name or event..."
              sx={{ minWidth: 250 }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
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
              <Table stickyHeader aria-label="hours review table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Volunteer
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Opportunity
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Hours
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      Status
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, fontSize: "0.875rem", width: 120 }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hours.length > 0 ? (
                    hours.map((hour) => (
                      <TableRow key={hour.id}>
                        <TableCell>{hour.volunteerName}</TableCell>
                        <TableCell>{formatDate(hour.date)}</TableCell>
                        <TableCell>{hour.opportunityTitle || "N/A"}</TableCell>
                        <TableCell>{hour.hours.toFixed(2)}</TableCell>
                        <TableCell>
                          <StatusBadge
                            label={hour.status}
                            color={getHoursStatusColor(hour.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {hour.status === "pending" && (
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApprove(hour.id)}
                                  disabled={isMutating}
                                  aria-label="approve"
                                >
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRejectClick(hour.id)}
                                  disabled={isMutating}
                                  aria-label="reject"
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : loading ? null : (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState message="No hours found" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePaginationFooter
              total={total}
              page={page}
              limit={limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </Paper>
        </Box>
      </Box>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectCancel}>
        <DialogTitle>Reject Hours</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Please provide a reason for rejecting these hours (optional):
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCancel}>Cancel</Button>
          <Button
            onClick={handleRejectConfirm}
            color="error"
            variant="contained"
            disabled={isMutating}
          >
            {isMutating ? <CircularProgress size={20} /> : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
