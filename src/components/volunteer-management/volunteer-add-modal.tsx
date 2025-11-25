"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { ReactElement, useMemo, useState } from "react";
import validator from "validator";

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
  const [bio, setBio] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  function markTouched(field: string): void {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e?: React.FormEvent): Promise<void> {
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
        volunteerType: volunteerType === "" ? undefined : volunteerType,
        bio: bio.trim() || undefined,
      };

      // This just adds a volunteer without verifying them first
      // #TODO: volunteer is only added to database after they have been verified
      const response = await fetch("/api/staff/volunteers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Try to parse JSON body
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        // Prefer backend message, then error, then statusText
        let msg = response.statusText || "Failed to create volunteer";
        if (json?.message) msg = json.message;
        else if (json?.error) {
          msg =
            typeof json.error === "string"
              ? json.error
              : JSON.stringify(json.error);
        }
        throw new Error(msg);
      }

      // Backend returns { message, data } where data is created volunteer
      const created: Volunteer = json?.data ?? json;

      // clear form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setVolunteerType("");
      setBio("");
      setTouched({});
      setSubmitError(null);

      // notify parent
      if (onCreated && created) onCreated(created);

      // close modal
      onClose();
    } catch (error: unknown) {
      console.error("Failed to create volunteer:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create volunteer",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleTypeChange(e: SelectChangeEvent): void {
    setVolunteerType(e.target.value as string);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>
          <Typography variant="h6" component="div">
            Add Volunteer
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            <TextField
              label={
                <span>
                  First Name <span style={{ color: "red" }}>*</span>
                </span>
              }
              value={firstName}
              onChange={(ev) => setFirstName(ev.target.value)}
              onBlur={() => markTouched("firstName")}
              error={!!firstNameError}
              helperText={firstNameError ? "First name is required" : ""}
              fullWidth
            />

            <TextField
              label={
                <span>
                  Last Name <span style={{ color: "red" }}>*</span>
                </span>
              }
              value={lastName}
              onChange={(ev) => setLastName(ev.target.value)}
              onBlur={() => markTouched("lastName")}
              error={!!lastNameError}
              helperText={lastNameError ? "Last name is required" : ""}
              fullWidth
            />

            <TextField
              label={
                <span>
                  Email <span style={{ color: "red" }}>*</span>
                </span>
              }
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
            />

            <TextField
              label="Phone"
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              placeholder="(optional)"
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="volunteer-type-label">Volunteer Type</InputLabel>
              <Select
                labelId="volunteer-type-label"
                label="Volunteer Type"
                value={volunteerType}
                onChange={handleTypeChange}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="mentor">Mentor</MenuItem>
                <MenuItem value="speaker">Speaker</MenuItem>
                <MenuItem value="flexible">Flexible</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Bio"
              value={bio}
              onChange={(ev) => setBio(ev.target.value)}
              multiline
              rows={4}
              placeholder="Optional short bio"
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Box sx={{ mr: "auto" }}>
            <Button onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          </Box>

          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !isFormValid}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
          >
            {submitting ? "Saving..." : "Add Volunteer"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
