"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { type ReactElement, useCallback, useMemo, useState } from "react";

import type { RecipientType } from "./types";

export type ComposeModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  userRole: "staff" | "admin";
};

/**
 * ComposeModal
 *
 * Modal for composing new bulk communications.
 * Role-based: Admin can send to volunteers, staff, or both. Staff can only send to volunteers.
 */
export default function ComposeModal({
  open,
  onClose,
  onCreated,
  userRole,
}: ComposeModalProps): ReactElement {
  // Form state
  const [recipientType, setRecipientType] =
    useState<RecipientType>("volunteers");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { enqueueSnackbar } = useSnackbar();

  // Validations
  const subjectError = useMemo(
    () => touched.subject && subject.trim() === "",
    [subject, touched.subject],
  );
  const bodyError = useMemo(
    () => touched.body && body.trim() === "",
    [body, touched.body],
  );

  const isFormValid =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    (userRole === "admin" || recipientType === "volunteers");

  const markTouched = useCallback((field: string): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<void> => {
      if (e) e.preventDefault();
      markTouched("subject");
      markTouched("body");
      setSubmitError(null);

      if (!isFormValid) {
        return;
      }

      setSubmitting(true);

      try {
        const response = await fetch("/api/staff/communications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: subject.trim(),
            body: body.trim(),
            recipientType,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to send communication");
        }

        const result = await response.json();
        const recipientCount = result.recipientCount || 0;
        const emailSent = result.emailSent;
        const emailError = result.emailError;

        if (recipientCount === 0) {
          enqueueSnackbar(
            "Communication created but no recipients found. Please check your recipient selection.",
            { variant: "warning", autoHideDuration: 5000 },
          );
        } else if (emailSent && !emailError) {
          enqueueSnackbar(
            `Communication sent successfully to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}`,
            { variant: "success" },
          );
        } else if (emailSent && emailError) {
          enqueueSnackbar(
            `Communication sent to some recipients, but some emails failed. Check server logs for details.`,
            { variant: "warning", autoHideDuration: 5000 },
          );
        } else {
          enqueueSnackbar(
            "Communication created but emails failed to send. Check server logs for details.",
            { variant: "error", autoHideDuration: 5000 },
          );
        }

        // Reset form
        setSubject("");
        setBody("");
        setRecipientType("volunteers");
        setTouched({});
        setSubmitError(null);

        onCreated?.();
        onClose();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to send communication";
        setSubmitError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: "error" });
      } finally {
        setSubmitting(false);
      }
    },
    [
      subject,
      body,
      recipientType,
      isFormValid,
      markTouched,
      onCreated,
      onClose,
      enqueueSnackbar,
    ],
  );

  const handleClose = useCallback(() => {
    if (submitting) return;
    setSubject("");
    setBody("");
    setRecipientType("volunteers");
    setTouched({});
    setSubmitError(null);
    onClose();
  }, [submitting, onClose]);

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Compose Communication</Typography>
            <IconButton
              onClick={handleClose}
              disabled={submitting}
              size="small"
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <FormControl component="fieldset">
              <Typography variant="subtitle2" gutterBottom>
                Recipients
              </Typography>
              <RadioGroup
                value={recipientType}
                onChange={(e) =>
                  setRecipientType(e.target.value as RecipientType)
                }
              >
                <FormControlLabel
                  value="volunteers"
                  control={<Radio />}
                  label="Volunteers"
                />
                {userRole === "admin" && (
                  <>
                    <FormControlLabel
                      value="staff"
                      control={<Radio />}
                      label="Staff"
                    />
                    <FormControlLabel
                      value="both"
                      control={<Radio />}
                      label="Staff & Volunteers"
                    />
                  </>
                )}
              </RadioGroup>
            </FormControl>

            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={() => markTouched("subject")}
              error={subjectError}
              helperText={subjectError ? "Subject is required" : ""}
              required
              fullWidth
              disabled={submitting}
            />

            <TextField
              label="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={() => markTouched("body")}
              error={bodyError}
              helperText={bodyError ? "Message is required" : ""}
              required
              fullWidth
              multiline
              rows={8}
              disabled={submitting}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isFormValid || submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {submitting ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
