"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import PersonIcon from "@mui/icons-material/Person";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { type ReactElement, useCallback, useMemo, useState } from "react";

import { type Volunteer } from "./types";

/**
 * PendingInvitesTable
 *
 * Displays pending invites (volunteers with unverified emails) in a paginated table.
 * Rows are clickable and trigger the onVolunteerClick callback to open the volunteer profile modal.
 */
type PendingInvitesTableProps = {
  volunteers: Volunteer[];
  totalVolunteers: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onVolunteerClick: (volunteerId: number) => void;
  onRefresh?: () => void;
  loading?: boolean;
};

const getStatusLabel = (
  status:
    | "not_required"
    | "pending"
    | "approved"
    | "rejected"
    | null
    | undefined,
): string => {
  if (!status || status === "not_required") return "Not Required";
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  return "Rejected";
};

const getRequirements = (
  volunteer: Volunteer,
): {
  emailVerified: boolean;
  backgroundCheckPending: boolean;
} => ({
  emailVerified: volunteer.isEmailVerified,
  backgroundCheckPending: volunteer.backgroundCheckStatus === "pending",
});

export default function PendingInvitesTable({
  volunteers,
  totalVolunteers,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onVolunteerClick,
  onRefresh,
  loading = false,
}: PendingInvitesTableProps): ReactElement {
  const [resendingEmails, setResendingEmails] = useState<Set<number>>(
    new Set(),
  );
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set());
  const [pendingStatusChanges, setPendingStatusChanges] = useState<
    Map<number, "not_required" | "pending" | "approved">
  >(new Map());
  const [confirmResendEmail, setConfirmResendEmail] = useState<{
    open: boolean;
    volunteerId: number | null;
    volunteerName: string;
  }>({ open: false, volunteerId: null, volunteerName: "" });
  const [confirmStatusChange, setConfirmStatusChange] = useState<{
    open: boolean;
    volunteerId: number | null;
    volunteerName: string;
    currentStatus: string;
    newStatus: string;
    newStatusValue: "not_required" | "pending" | "approved";
  }>({
    open: false,
    volunteerId: null,
    volunteerName: "",
    currentStatus: "",
    newStatus: "",
    newStatusValue: "not_required",
  });
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    volunteerId: number | null;
    volunteerName: string;
  }>({ open: false, volunteerId: null, volunteerName: "" });
  const [deleting, setDeleting] = useState<Set<number>>(new Set());

  const handleRowClick = useCallback(
    (volunteerId: number): void => {
      onVolunteerClick(volunteerId);
    },
    [onVolunteerClick],
  );

  const maxPage = useMemo(
    () => Math.ceil(totalVolunteers / limit),
    [totalVolunteers, limit],
  );

  const handleFirstPageButtonClick = useCallback((): void => {
    onPageChange(1);
  }, [onPageChange]);

  const handleBackButtonClick = useCallback((): void => {
    onPageChange(page - 1);
  }, [onPageChange, page]);

  const handleNextButtonClick = useCallback((): void => {
    onPageChange(page + 1);
  }, [onPageChange, page]);

  const handleLastPageButtonClick = useCallback((): void => {
    onPageChange(maxPage);
  }, [onPageChange, maxPage]);

  const startIndex = useMemo(() => (page - 1) * limit + 1, [page, limit]);
  const endIndex = useMemo(
    () => Math.min(page * limit, totalVolunteers),
    [page, limit, totalVolunteers],
  );

  const handleResendEmailClick = (
    e: React.MouseEvent,
    volunteerId: number,
    volunteerName: string,
    backgroundCheckStatus:
      | "not_required"
      | "pending"
      | "approved"
      | "rejected"
      | null
      | undefined,
  ): void => {
    e.stopPropagation();

    // Check if background check is approved or not required
    if (
      backgroundCheckStatus !== "approved" &&
      backgroundCheckStatus !== "not_required"
    ) {
      enqueueSnackbar(
        "Cannot send email: Background check must be approved or not required",
        { variant: "error" },
      );
      return;
    }

    setConfirmResendEmail({
      open: true,
      volunteerId,
      volunteerName,
    });
  };

  const handleConfirmResendEmail = async (): Promise<void> => {
    if (!confirmResendEmail.volunteerId) return;

    const volunteerId = confirmResendEmail.volunteerId;
    setConfirmResendEmail({
      open: false,
      volunteerId: null,
      volunteerName: "",
    });
    setResendingEmails((prev) => new Set(prev).add(volunteerId));
    try {
      const response = await fetch(
        `/api/staff/volunteers/${volunteerId}/resend-credentials`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend email");
      }
      enqueueSnackbar("Welcome email sent successfully", {
        variant: "success",
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to resend email:", error);
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to resend email",
        { variant: "error" },
      );
    } finally {
      setResendingEmails((prev) => {
        const next = new Set(prev);
        next.delete(volunteerId);
        return next;
      });
    }
  };

  const handleStatusChange = (
    e: SelectChangeEvent<string>,
    volunteerId: number,
    volunteerName: string,
  ): void => {
    e.stopPropagation();
    const newStatusValue = e.target.value as
      | "not_required"
      | "pending"
      | "approved"
      | "rejected";
    const volunteer = volunteers.find((v) => v.id === volunteerId);
    const currentStatus =
      (volunteer?.backgroundCheckStatus as
        | "not_required"
        | "pending"
        | "approved"
        | "rejected"
        | null
        | undefined) || "not_required";

    // If changing to rejected, show delete modal directly
    if (newStatusValue === "rejected") {
      setConfirmDelete({
        open: true,
        volunteerId,
        volunteerName,
      });
      // Reset dropdown to current value
      setPendingStatusChanges((prev) => {
        const next = new Map(prev);
        next.delete(volunteerId);
        return next;
      });
      return;
    }

    // Store the pending change temporarily
    setPendingStatusChanges((prev) => {
      const next = new Map(prev);
      next.set(volunteerId, newStatusValue);
      return next;
    });

    setConfirmStatusChange({
      open: true,
      volunteerId,
      volunteerName,
      currentStatus: getStatusLabel(currentStatus),
      newStatus: getStatusLabel(newStatusValue),
      newStatusValue,
    });
  };

  const handleDeleteUser = async (): Promise<void> => {
    if (!confirmDelete.volunteerId) return;

    const volunteerId = confirmDelete.volunteerId;
    setConfirmDelete({ open: false, volunteerId: null, volunteerName: "" });
    setDeleting((prev) => new Set(prev).add(volunteerId));

    try {
      const response = await fetch(`/api/staff/volunteers/${volunteerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete volunteer");
      }

      enqueueSnackbar("Volunteer deleted successfully", {
        variant: "success",
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to delete volunteer:", error);
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to delete volunteer",
        { variant: "error" },
      );
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(volunteerId);
        return next;
      });
    }
  };

  const handleConfirmStatusChange = async (): Promise<void> => {
    if (!confirmStatusChange.volunteerId) return;

    const volunteerId = confirmStatusChange.volunteerId;
    const statusValue = confirmStatusChange.newStatusValue;

    setConfirmStatusChange({
      open: false,
      volunteerId: null,
      volunteerName: "",
      currentStatus: "",
      newStatus: "",
      newStatusValue: "not_required",
    });

    // Clear pending change
    setPendingStatusChanges((prev) => {
      const next = new Map(prev);
      next.delete(volunteerId);
      return next;
    });

    setUpdatingStatus((prev) => new Set(prev).add(volunteerId));
    try {
      const response = await fetch(`/api/staff/volunteers/${volunteerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backgroundCheckStatus: statusValue,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Failed to update background check status",
        );
      }
      enqueueSnackbar("Background check status updated successfully", {
        variant: "success",
      });

      // If status is approved or not_required, automatically send welcome email
      if (statusValue === "approved" || statusValue === "not_required") {
        try {
          const emailResponse = await fetch(
            `/api/staff/volunteers/${volunteerId}/resend-credentials`,
            {
              method: "POST",
            },
          );
          if (emailResponse.ok) {
            enqueueSnackbar("Welcome email sent successfully", {
              variant: "success",
            });
          } else {
            const emailError = await emailResponse.json();
            console.error("Failed to send email:", emailError);
            enqueueSnackbar(
              emailError.message || "Status updated but failed to send email",
              { variant: "warning" },
            );
          }
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
          enqueueSnackbar(
            "Status updated but failed to send email. You can resend it manually.",
            { variant: "warning" },
          );
        }
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to update background check status:", error);
      enqueueSnackbar(
        error instanceof Error
          ? error.message
          : "Failed to update background check status",
        { variant: "error" },
      );
    } finally {
      setUpdatingStatus((prev) => {
        const next = new Set(prev);
        next.delete(volunteerId);
        return next;
      });
    }
  };

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
        <Table stickyHeader aria-label="pending invites table">
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
                Contacts
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Requirements
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {volunteers && volunteers.length > 0 ? (
              volunteers.map((volunteer) => {
                const requirements = getRequirements(volunteer);
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
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography variant="body2">
                          {volunteer.email}
                        </Typography>
                        {volunteer.phone && (
                          <Typography variant="body2" color="text.secondary">
                            {volunteer.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                          alignItems: "flex-start",
                        }}
                      >
                        <Tooltip
                          title={
                            requirements.emailVerified
                              ? "Email verified"
                              : "Email verification pending"
                          }
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {requirements.emailVerified ? (
                              <CheckCircleIcon
                                fontSize="small"
                                color="success"
                              />
                            ) : (
                              <WarningIcon fontSize="small" color="warning" />
                            )}
                            <Typography variant="caption">
                              Email Verification
                            </Typography>
                          </Box>
                        </Tooltip>
                        <Tooltip
                          title={
                            requirements.backgroundCheckPending
                              ? "Background check pending"
                              : "Background check complete"
                          }
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {requirements.backgroundCheckPending ? (
                              <WarningIcon fontSize="small" color="warning" />
                            ) : (
                              <CheckCircleIcon
                                fontSize="small"
                                color="success"
                              />
                            )}
                            <Typography variant="caption">
                              Background Check
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={
                              pendingStatusChanges.get(volunteer.id) ??
                              volunteer.backgroundCheckStatus ??
                              "not_required"
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                e,
                                volunteer.id,
                                `${volunteer.firstName} ${volunteer.lastName}`,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            disabled={updatingStatus.has(volunteer.id)}
                            sx={{ fontSize: "0.875rem" }}
                          >
                            <MenuItem value="not_required">
                              Not Required
                            </MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                          </Select>
                        </FormControl>
                        {updatingStatus.has(volunteer.id) && (
                          <CircularProgress size={16} />
                        )}
                        <Tooltip title="Resend Welcome Email">
                          <IconButton
                            size="small"
                            onClick={(e) =>
                              handleResendEmailClick(
                                e,
                                volunteer.id,
                                `${volunteer.firstName} ${volunteer.lastName}`,
                                volunteer.backgroundCheckStatus,
                              )
                            }
                            disabled={
                              resendingEmails.has(volunteer.id) ||
                              (volunteer.backgroundCheckStatus !== "approved" &&
                                volunteer.backgroundCheckStatus !==
                                  "not_required")
                            }
                          >
                            {resendingEmails.has(volunteer.id) ? (
                              <CircularProgress size={20} />
                            ) : (
                              <EmailIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No pending invites
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          borderTop: 1,
          borderColor: "divider",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
        }}
      >
        {/* Left: Showing results */}
        <Typography variant="body2" color="text.secondary">
          Showing results {startIndex} to {endIndex} out of {totalVolunteers}
        </Typography>

        {/* Middle: Page navigation */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={handleFirstPageButtonClick}
            disabled={page === 1}
            aria-label="first page"
            size="small"
          >
            <FirstPageIcon />
          </IconButton>
          <IconButton
            onClick={handleBackButtonClick}
            disabled={page === 1}
            aria-label="previous page"
            size="small"
          >
            <KeyboardArrowLeft />
          </IconButton>
          <Typography variant="body2" sx={{ mx: 1 }}>
            Page {page}
          </Typography>
          <IconButton
            onClick={handleNextButtonClick}
            disabled={page >= maxPage}
            aria-label="next page"
            size="small"
          >
            <KeyboardArrowRight />
          </IconButton>
          <IconButton
            onClick={handleLastPageButtonClick}
            disabled={page >= maxPage}
            aria-label="last page"
            size="small"
          >
            <LastPageIcon />
          </IconButton>
        </Box>

        {/* Right: Rows per page */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 70 }}>
            <Select
              value={String(limit)}
              onChange={(e) => {
                const value = e.target.value;
                onLimitChange(Number.parseInt(value, 10));
              }}
              sx={{ fontSize: "0.875rem" }}
            >
              <MenuItem value="5">5</MenuItem>
              <MenuItem value="10">10</MenuItem>
              <MenuItem value="25">25</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Resend Email Confirmation Dialog */}
      <Dialog
        open={confirmResendEmail.open}
        onClose={() =>
          setConfirmResendEmail({
            open: false,
            volunteerId: null,
            volunteerName: "",
          })
        }
      >
        <DialogTitle>Resend Welcome Email</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to resend the welcome email to{" "}
            <strong>{confirmResendEmail.volunteerName}</strong>? A new password
            will be generated and sent to their email address.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmResendEmail({
                open: false,
                volunteerId: null,
                volunteerName: "",
              })
            }
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmResendEmail} variant="contained">
            Resend Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog
        open={confirmStatusChange.open}
        onClose={() => {
          setConfirmStatusChange({
            open: false,
            volunteerId: null,
            volunteerName: "",
            currentStatus: "",
            newStatus: "",
            newStatusValue: "not_required",
          });
          // Clear pending change on cancel
          if (confirmStatusChange.volunteerId) {
            setPendingStatusChanges((prev) => {
              const next = new Map(prev);
              next.delete(confirmStatusChange.volunteerId!);
              return next;
            });
          }
        }}
      >
        <DialogTitle>Change Background Check Status</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to change the background check status for{" "}
            <strong>{confirmStatusChange.volunteerName}</strong> from{" "}
            <strong>{confirmStatusChange.currentStatus}</strong> to{" "}
            <strong>{confirmStatusChange.newStatus}</strong>?
          </Typography>
          {(confirmStatusChange.newStatusValue === "approved" ||
            confirmStatusChange.newStatusValue === "not_required") && (
            <Typography
              variant="body2"
              color="primary"
              sx={{ fontWeight: 500, fontStyle: "italic" }}
            >
              A welcome email will be automatically sent to the volunteer after
              the status is updated.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmStatusChange({
                open: false,
                volunteerId: null,
                volunteerName: "",
                currentStatus: "",
                newStatus: "",
                newStatusValue: "not_required",
              });
              // Clear pending change on cancel
              if (confirmStatusChange.volunteerId) {
                setPendingStatusChanges((prev) => {
                  const next = new Map(prev);
                  next.delete(confirmStatusChange.volunteerId!);
                  return next;
                });
              }
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmStatusChange} variant="contained">
            Change Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={confirmDelete.open}
        onClose={() =>
          setConfirmDelete({
            open: false,
            volunteerId: null,
            volunteerName: "",
          })
        }
      >
        <DialogTitle>Delete Volunteer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{confirmDelete.volunteerName}</strong>? This action cannot
            be undone. The volunteer's account and all associated data will be
            permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDelete({
                open: false,
                volunteerId: null,
                volunteerName: "",
              })
            }
            disabled={deleting.has(confirmDelete.volunteerId || 0)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
            disabled={deleting.has(confirmDelete.volunteerId || 0)}
          >
            {deleting.has(confirmDelete.volunteerId || 0)
              ? "Deleting..."
              : "Delete Volunteer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
