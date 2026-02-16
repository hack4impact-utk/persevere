"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import InfoIcon from "@mui/icons-material/Info";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type ReactElement, useCallback, useMemo, useState } from "react";
import validator from "validator";

import { apiClient } from "@/lib/api-client";

import type { Volunteer } from "./types";

export type AddVolunteerModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (volunteer: Volunteer) => void;
};

/**
 * AddVolunteerModal
 *
 * Modal that appears when clicking Add Volunteer.
 * Validates itself (email, required fields) before allowing submission.
 */
export default function AddVolunteerModal({
  open,
  onClose,
  onCreated,
}: AddVolunteerModalProps): ReactElement {
  // form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [volunteerType, setVolunteerType] = useState("");
  const [isAlumni, setIsAlumni] = useState(false);
  const [backgroundCheckStatus, setBackgroundCheckStatus] = useState("");
  const [mediaRelease, setMediaRelease] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    emailSent: boolean;
    emailError: boolean;
    backgroundCheckStatus: string;
    volunteerName: string;
    volunteerEmail: string;
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
  const volunteerTypeError = useMemo(
    () => touched.volunteerType && volunteerType === "",
    [volunteerType, touched.volunteerType],
  );
  const backgroundCheckStatusError = useMemo(
    () => touched.backgroundCheckStatus && backgroundCheckStatus === "",
    [backgroundCheckStatus, touched.backgroundCheckStatus],
  );

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    validator.isEmail(email.trim()) &&
    volunteerType !== "" &&
    backgroundCheckStatus !== "";

  const markTouched = useCallback((field: string): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<void> => {
      if (e) e.preventDefault();
      markTouched("firstName");
      markTouched("lastName");
      markTouched("email");
      markTouched("volunteerType");
      markTouched("backgroundCheckStatus");
      setSubmitError(null);

      if (!isFormValid) {
        return;
      }

      setSubmitting(true);
      try {
        const currentBackgroundCheckStatus =
          backgroundCheckStatus === ""
            ? undefined
            : (backgroundCheckStatus as
                | "not_required"
                | "pending"
                | "approved");

        const payload: {
          firstName: string;
          lastName: string;
          email: string;
          phone?: string;
          volunteerType?: string;
          isAlumni: boolean;
          backgroundCheckStatus?: "not_required" | "pending" | "approved";
          mediaRelease: boolean;
        } = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          volunteerType: volunteerType === "" ? undefined : volunteerType,
          isAlumni,
          backgroundCheckStatus: currentBackgroundCheckStatus,
          mediaRelease,
        };

        // This just adds a volunteer without verifying them first
        // #TODO: volunteer is only added to database after they have been verified
        const json = await apiClient.post<{
          message?: string;
          data?: Volunteer;
          emailSent?: boolean;
          emailError?: boolean;
          backgroundCheckStatus?: string;
        }>("/api/staff/volunteers", payload);

        // Backend returns { message, data, emailSent, emailError, backgroundCheckStatus }
        const created: Volunteer = json?.data ?? (json as unknown as Volunteer);
        const emailSent = json?.emailSent ?? false;
        const emailError = json?.emailError ?? false;
        const responseBackgroundCheckStatus = json?.backgroundCheckStatus ?? "";

        // Store volunteer name before clearing form
        const volunteerName = `${firstName.trim()} ${lastName.trim()}`;
        const volunteerEmail = email.trim();

        // clear form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setVolunteerType("");
        setIsAlumni(false);
        setBackgroundCheckStatus("");
        setMediaRelease(false);
        setTouched({});
        setSubmitError(null);

        // Set success data and show success dialog
        setSuccessData({
          emailSent,
          emailError,
          backgroundCheckStatus: responseBackgroundCheckStatus,
          volunteerName,
          volunteerEmail,
        });
        setSuccessDialogOpen(true);

        // notify parent
        if (onCreated && created) onCreated(created);
      } catch (error: unknown) {
        console.error("Failed to create volunteer:", error);
        setSubmitError(
          error instanceof Error ? error.message : "Failed to create volunteer",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      firstName,
      lastName,
      email,
      phone,
      volunteerType,
      isAlumni,
      backgroundCheckStatus,
      mediaRelease,
      isFormValid,
      markTouched,
      onCreated,
    ],
  );

  const handleTypeChange = useCallback(
    (e: SelectChangeEvent): void => {
      setVolunteerType(e.target.value as string);
      markTouched("volunteerType");
    },
    [markTouched],
  );

  const handleBackgroundCheckStatusChange = useCallback(
    (e: SelectChangeEvent): void => {
      setBackgroundCheckStatus(e.target.value as string);
      markTouched("backgroundCheckStatus");
    },
    [markTouched],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle
          sx={{
            pb: 2,
            pt: 3,
            px: 3,
          }}
        >
          <Typography variant="h5" component="div" fontWeight={600}>
            Add New Volunteer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Fill in the information below to add a new volunteer
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Stack spacing={3}>
            {submitError && (
              <Alert severity="error" sx={{ borderRadius: 1 }}>
                {submitError}
              </Alert>
            )}

            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Basic Information
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(ev) => setFirstName(ev.target.value)}
                  onBlur={() => markTouched("firstName")}
                  error={!!firstNameError}
                  helperText={firstNameError ? "First name is required" : ""}
                  fullWidth
                  required
                  variant="outlined"
                />

                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(ev) => setLastName(ev.target.value)}
                  onBlur={() => markTouched("lastName")}
                  error={!!lastNameError}
                  helperText={lastNameError ? "Last name is required" : ""}
                  fullWidth
                  required
                  variant="outlined"
                />

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  onBlur={() => markTouched("email")}
                  error={!!emailError}
                  helperText={
                    emailError
                      ? email.trim() === ""
                        ? "Email is required"
                        : "Please enter a valid email"
                      : ""
                  }
                  fullWidth
                  required
                  variant="outlined"
                />

                <TextField
                  label="Phone"
                  value={phone}
                  onChange={(ev) => setPhone(ev.target.value)}
                  placeholder="(optional)"
                  fullWidth
                  variant="outlined"
                />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Volunteer Details
              </Typography>
              <Stack spacing={2.5}>
                <FormControl fullWidth required error={!!volunteerTypeError}>
                  <InputLabel id="volunteer-type-label">
                    Volunteer Type
                  </InputLabel>
                  <Select
                    labelId="volunteer-type-label"
                    label="Volunteer Type"
                    value={volunteerType}
                    onChange={handleTypeChange}
                    onBlur={() => markTouched("volunteerType")}
                    displayEmpty
                  >
                    <MenuItem value="mentor">Mentor</MenuItem>
                    <MenuItem value="speaker">Speaker</MenuItem>
                    <MenuItem value="flexible">Flexible</MenuItem>
                  </Select>
                  {volunteerTypeError && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 1.75 }}
                    >
                      Volunteer type is required
                    </Typography>
                  )}
                </FormControl>

                <FormControl
                  fullWidth
                  required
                  error={!!backgroundCheckStatusError}
                >
                  <InputLabel id="background-check-status-label">
                    Background Check Status
                  </InputLabel>
                  <Select
                    labelId="background-check-status-label"
                    label="Background Check Status"
                    value={backgroundCheckStatus}
                    onChange={handleBackgroundCheckStatusChange}
                    onBlur={() => markTouched("backgroundCheckStatus")}
                    displayEmpty
                  >
                    <MenuItem value="not_required">Not Required</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                  </Select>
                  {backgroundCheckStatusError && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 1.75 }}
                    >
                      Background check status is required
                    </Typography>
                  )}
                </FormControl>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Additional Information
              </Typography>
              <Stack spacing={1.5}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isAlumni}
                      onChange={(e) => setIsAlumni(e.target.checked)}
                      sx={{ "& .MuiSvgIcon-root": { fontSize: 20 } }}
                    />
                  }
                  label={<Typography variant="body2">Alumni</Typography>}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={mediaRelease}
                      onChange={(e) => setMediaRelease(e.target.checked)}
                      sx={{ "& .MuiSvgIcon-root": { fontSize: 20 } }}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Media Release Signed
                    </Typography>
                  }
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
          <Button
            onClick={onClose}
            disabled={submitting}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !isFormValid}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
            sx={{ minWidth: 140 }}
          >
            {submitting ? "Saving..." : "Add Volunteer"}
          </Button>
        </DialogActions>
      </form>

      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          onClose();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            pt: 3,
            px: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" component="div" fontWeight={600}>
                Volunteer Created Successfully
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {successData?.volunteerName} has been added to the system
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Stack spacing={3}>
            {/* Email Status */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Email Status
              </Typography>
              {successData?.emailSent ? (
                <Alert
                  severity="success"
                  icon={<EmailIcon />}
                  sx={{ borderRadius: 1 }}
                >
                  Welcome email has been sent to {successData?.volunteerEmail}
                </Alert>
              ) : successData?.emailError ? (
                <Alert
                  severity="warning"
                  icon={<EmailIcon />}
                  sx={{ borderRadius: 1 }}
                >
                  Volunteer was created, but the welcome email could not be
                  sent. You can resend it from the Pending Invites tab.
                </Alert>
              ) : (
                <Alert
                  severity="info"
                  icon={<InfoIcon />}
                  sx={{ borderRadius: 1 }}
                >
                  Welcome email was not sent because the background check status
                  is set to "Pending". The volunteer will need to verify their
                  email and complete their background check before receiving
                  access.
                </Alert>
              )}
            </Box>

            {/* Next Steps */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Next Steps
              </Typography>
              <List dense sx={{ py: 0 }}>
                {successData?.backgroundCheckStatus === "pending" && (
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <InfoIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Update Background Check Status"
                      secondary="Once the background check is complete, update the status in the Pending Invites tab to send the welcome email."
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                )}
                {!successData?.emailSent && !successData?.emailError && (
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <EmailIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Resend Welcome Email"
                      secondary="You can resend the welcome email from the Pending Invites tab once the background check is approved."
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                )}
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="View Volunteer Profile"
                    secondary="You can view and manage the volunteer's profile from the volunteers table."
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
                {successData?.backgroundCheckStatus === "pending" && (
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <InfoIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Monitor Progress"
                      secondary="Check the Pending Invites tab to track email verification and background check status."
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button
            onClick={() => {
              setSuccessDialogOpen(false);
              onClose();
            }}
            variant="contained"
            sx={{ minWidth: 120 }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
