"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Avatar,
  Box,
  CircularProgress,
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
import { type ReactElement, useCallback, useState } from "react";

import { ConfirmDialog, TablePaginationFooter } from "@/components/shared";
import { useVolunteers } from "@/hooks/use-volunteers";

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
  backgroundCheckNotRequired: boolean;
} => ({
  emailVerified: volunteer.isEmailVerified,
  backgroundCheckPending: volunteer.backgroundCheckStatus === "pending",
  backgroundCheckNotRequired:
    volunteer.backgroundCheckStatus === "not_required",
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
  const { resendCredentials, updateBackgroundStatus, deleteVolunteer } =
    useVolunteers("", {}, { skip: true });

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
    const success = await resendCredentials(volunteerId);
    setResendingEmails((prev) => {
      const next = new Set(prev);
      next.delete(volunteerId);
      return next;
    });
    if (success) {
      enqueueSnackbar("Welcome email sent successfully", {
        variant: "success",
      });
      if (onRefresh) onRefresh();
    } else {
      enqueueSnackbar("Failed to send welcome email", { variant: "error" });
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
    const success = await deleteVolunteer(volunteerId);
    setDeleting((prev) => {
      const next = new Set(prev);
      next.delete(volunteerId);
      return next;
    });
    if (success) {
      enqueueSnackbar("Volunteer deleted successfully", { variant: "success" });
      if (onRefresh) onRefresh();
    } else {
      enqueueSnackbar("Failed to delete volunteer", { variant: "error" });
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
    const updated = await updateBackgroundStatus(volunteerId, statusValue);
    setUpdatingStatus((prev) => {
      const next = new Set(prev);
      next.delete(volunteerId);
      return next;
    });

    if (!updated) {
      enqueueSnackbar("Failed to update background check status", {
        variant: "error",
      });
      return;
    }

    enqueueSnackbar("Background check status updated successfully", {
      variant: "success",
    });

    // If status is approved or not_required, automatically send welcome email
    if (statusValue === "approved" || statusValue === "not_required") {
      const emailSent = await resendCredentials(volunteerId);
      if (emailSent) {
        enqueueSnackbar("Welcome email sent successfully", {
          variant: "success",
        });
      } else {
        enqueueSnackbar(
          "Status updated but failed to send email. You can resend it manually.",
          { variant: "warning" },
        );
      }
    }

    if (onRefresh) onRefresh();
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
            {volunteers.length > 0 ? (
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
                              : requirements.backgroundCheckNotRequired
                                ? "Background check not required"
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
                            ) : requirements.backgroundCheckNotRequired ? (
                              <RemoveCircleOutlineIcon
                                fontSize="small"
                                color="disabled"
                              />
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
                            disabled={
                              updatingStatus.has(volunteer.id) ||
                              deleting.has(volunteer.id)
                            }
                            sx={{
                              fontSize: "0.875rem",
                              "& .MuiSelect-select": { textAlign: "center" },
                            }}
                          >
                            <MenuItem
                              value="not_required"
                              sx={{ justifyContent: "center" }}
                            >
                              Not Required
                            </MenuItem>
                            <MenuItem
                              value="pending"
                              sx={{ justifyContent: "center" }}
                            >
                              Pending
                            </MenuItem>
                            <MenuItem
                              value="approved"
                              sx={{ justifyContent: "center" }}
                            >
                              Approved
                            </MenuItem>
                            <MenuItem
                              value="rejected"
                              sx={{ justifyContent: "center" }}
                            >
                              Rejected
                            </MenuItem>
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
            ) : loading ? null : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No pending invites
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

      <ConfirmDialog
        open={confirmResendEmail.open}
        title="Resend Welcome Email"
        message={
          <>
            Are you sure you want to resend the welcome email to{" "}
            <strong>{confirmResendEmail.volunteerName}</strong>? A new password
            will be generated and sent to their email address.
          </>
        }
        confirmLabel="Resend Email"
        onConfirm={handleConfirmResendEmail}
        onClose={() =>
          setConfirmResendEmail({
            open: false,
            volunteerId: null,
            volunteerName: "",
          })
        }
      />

      <ConfirmDialog
        open={confirmStatusChange.open}
        title="Change Background Check Status"
        message={
          <>
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
                A welcome email will be automatically sent to the volunteer
                after the status is updated.
              </Typography>
            )}
          </>
        }
        confirmLabel="Change Status"
        onConfirm={handleConfirmStatusChange}
        onClose={() => {
          setConfirmStatusChange({
            open: false,
            volunteerId: null,
            volunteerName: "",
            currentStatus: "",
            newStatus: "",
            newStatusValue: "not_required",
          });
          if (confirmStatusChange.volunteerId) {
            setPendingStatusChanges((prev) => {
              const next = new Map(prev);
              next.delete(confirmStatusChange.volunteerId!);
              return next;
            });
          }
        }}
      />

      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Volunteer"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>{confirmDelete.volunteerName}</strong>? This action cannot
            be undone. The volunteer&apos;s account and all associated data will
            be permanently removed.
          </>
        }
        confirmLabel="Delete Volunteer"
        confirmColor="error"
        loading={
          confirmDelete.volunteerId !== null &&
          deleting.has(confirmDelete.volunteerId)
        }
        onConfirm={handleDeleteUser}
        onClose={() =>
          setConfirmDelete({
            open: false,
            volunteerId: null,
            volunteerName: "",
          })
        }
      />
    </Paper>
  );
}
