"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import InfoIcon from "@mui/icons-material/Info";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type ReactElement, useCallback, useMemo, useState } from "react";
import validator from "validator";

import type { Staff } from "./types";

export type AddStaffModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (staff: Staff) => void;
};

/**
 * AddStaffModal
 *
 * Modal that appears when clicking Add Staff.
 * Validates itself (email, required fields) before allowing submission.
 */
export default function AddStaffModal({
  open,
  onClose,
  onCreated,
}: AddStaffModalProps): ReactElement {
  // form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    emailSent: boolean;
    emailError: boolean;
    staffName: string;
    staffEmail: string;
  } | null>(null);

  // Basic validations
  const firstNameError = useMemo(
    () => touched.firstName && firstName.trim() === "",
    [firstName, touched.firstName],
  );
  const lastNameError = useMemo(
    () => touched.lastName && lastName.trim() === "",
    [lastName, touched.lastName],
  );
  const emailError = useMemo(() => {
    if (!touched.email) return false;
    if (email.trim() === "") return true;
    return !validator.isEmail(email.trim());
  }, [email, touched.email]);

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    validator.isEmail(email.trim());

  const markTouched = useCallback((field: string): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<void> => {
      if (e) e.preventDefault();
      markTouched("firstName");
      markTouched("lastName");
      markTouched("email");
      setSubmitError(null);

      if (!isFormValid) {
        return;
      }

      setSubmitting(true);
      try {
        const payload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        };

        const response: Response = await fetch("/api/staff/staff", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const json: {
          message?: string;
          data?: Staff;
          error?: string | unknown;
          emailSent?: boolean;
          emailError?: boolean;
        } | null = await response.json().catch(() => null);

        if (!response.ok) {
          let msg = response.statusText || "Failed to create staff member";
          if (json?.message) msg = json.message;
          else if (json?.error) {
            msg =
              typeof json.error === "string"
                ? json.error
                : JSON.stringify(json.error);
          }
          throw new Error(msg);
        }

        const created: Staff = json?.data ?? (json as unknown as Staff);
        const emailSent = json?.emailSent ?? false;
        const emailError = json?.emailError ?? false;

        const staffName = `${firstName.trim()} ${lastName.trim()}`;
        const staffEmail = email.trim();

        // clear form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setTouched({});
        setSubmitError(null);

        setSuccessData({
          emailSent,
          emailError,
          staffName,
          staffEmail,
        });
        setSuccessDialogOpen(true);

        if (onCreated) {
          onCreated(created);
        }
      } catch (error) {
        console.error("Error creating staff:", error);
        setSubmitError(
          error instanceof Error ? error.message : "Failed to create staff member",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [firstName, lastName, email, phone, isFormValid, markTouched, onCreated],
  );

  const handleClose = useCallback((): void => {
    if (submitting) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setTouched({});
    setSubmitError(null);
    setSuccessDialogOpen(false);
    setSuccessData(null);
    onClose();
  }, [onClose, submitting]);

  const handleSuccessClose = useCallback((): void => {
    setSuccessDialogOpen(false);
    setSuccessData(null);
    handleClose();
  }, [handleClose]);

  return (
    <>
      <Dialog
        open={open && !successDialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Staff Member</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={(): void => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <TextField
              label="First Name"
              value={firstName}
              onChange={(e): void => setFirstName(e.target.value)}
              onBlur={(): void => markTouched("firstName")}
              error={firstNameError}
              helperText={firstNameError ? "First name is required" : ""}
              required
              fullWidth
              disabled={submitting}
            />

            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e): void => setLastName(e.target.value)}
              onBlur={(): void => markTouched("lastName")}
              error={lastNameError}
              helperText={lastNameError ? "Last name is required" : ""}
              required
              fullWidth
              disabled={submitting}
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e): void => setEmail(e.target.value)}
              onBlur={(): void => markTouched("email")}
              error={emailError}
              helperText={
                emailError
                  ? touched.email && email.trim() === ""
                    ? "Email is required"
                    : "Invalid email address"
                  : ""
              }
              required
              fullWidth
              disabled={submitting}
            />

            <TextField
              label="Phone (Optional)"
              type="tel"
              value={phone}
              onChange={(e): void => setPhone(e.target.value)}
              fullWidth
              disabled={submitting}
            />

            <Alert severity="info" icon={<InfoIcon />}>
              A welcome email with login credentials will be sent to the staff
              member&apos;s email address.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || !isFormValid}
          >
            {submitting ? <CircularProgress size={24} /> : "Add Staff Member"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={handleSuccessClose} maxWidth="sm">
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">Staff Member Added</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            <strong>{successData?.staffName}</strong> has been successfully added
            to the system.
          </Typography>

          <Divider sx={{ my: 2 }} />

          {successData?.emailSent ? (
            <Alert severity="success" icon={<EmailIcon />}>
              Welcome email sent to <strong>{successData.staffEmail}</strong>
            </Alert>
          ) : successData?.emailError ? (
            <Alert severity="warning" icon={<EmailIcon />}>
              Staff member was created, but the welcome email could not be sent.
              You can resend it later.
            </Alert>
          ) : (
            <Alert severity="info" icon={<InfoIcon />}>
              Welcome email will be sent to{" "}
              <strong>{successData?.staffEmail}</strong>
            </Alert>
          )}

          <List dense sx={{ mt: 2 }}>
            <ListItem>
              <ListItemIcon>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Next Steps"
                secondary="The staff member can now log in using their email and the password sent to them."
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuccessClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
