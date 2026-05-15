"use client";

import CloseIcon from "@mui/icons-material/Close";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { type ReactElement, useCallback, useMemo, useState } from "react";

import { MobileDialog } from "@/components/shared";
import { useCommunications } from "@/hooks/use-communications";
import { useEmailTemplates } from "@/hooks/use-email-templates";

import RichTextEditor from "./rich-text-editor";
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
 * Features a clean Gmail-like design with rich text editing and attachment support.
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");
  const [templateAnchorEl, setTemplateAnchorEl] = useState<HTMLElement | null>(
    null,
  );
  const templatePopoverOpen = Boolean(templateAnchorEl);

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

  // Check if body has actual content (not just empty HTML tags)
  const getPlainTextContent = useCallback((html: string): string => {
    if (!html) return "";
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || "";
  }, []);

  const isFormValid =
    subject.trim().length > 0 &&
    getPlainTextContent(body).trim().length > 0 &&
    (userRole === "admin" || recipientType === "volunteers");

  const markTouched = useCallback((field: string): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const { sendCommunication } = useCommunications({ skip: true });
  const { activeTemplates } = useEmailTemplates();

  // Handle template popover open/close
  const handleTemplateButtonClick = useCallback(
    (e: React.MouseEvent<HTMLElement>): void => {
      setTemplateAnchorEl(e.currentTarget);
    },
    [],
  );

  const handleTemplatePopoverClose = useCallback((): void => {
    setTemplateAnchorEl(null);
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (templateId: number | "") => {
      setSelectedTemplateId(templateId);
      setTemplateAnchorEl(null);
      if (templateId === "") {
        // Clear selection - don't change form values
        return;
      }
      const template = activeTemplates.find((t) => t.id === templateId);
      if (template) {
        setSubject(template.subject);
        setBody(template.body);
      }
    },
    [activeTemplates],
  );

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
        const result = await sendCommunication({
          subject: subject.trim(),
          body: body.trim(),
          recipientType,
        });

        if (!result) return; // handled by hook

        const recipientCount = result.recipientCount ?? 0;
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
        setSelectedTemplateId("");
        setTemplateAnchorEl(null);
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
      sendCommunication,
    ],
  );

  const handleClose = useCallback(() => {
    if (submitting) return;
    setSubject("");
    setBody("");
    setRecipientType("volunteers");
    setTouched({});
    setSelectedTemplateId("");
    setTemplateAnchorEl(null);
    setSubmitError(null);
    onClose();
  }, [submitting, onClose]);

  return (
    <MobileDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          New communication
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={submitting}
          size="small"
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Error Alert */}
        {submitError && (
          <Alert
            severity="error"
            onClose={() => setSubmitError(null)}
            sx={{ mx: 3, mt: 2, flexShrink: 0 }}
          >
            {submitError}
          </Alert>
        )}

        {/* Form Fields */}
        <Box
          sx={{
            px: 3,
            pt: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Recipients Field */}
          <Box sx={{ mb: 1 }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                mb: 0.75,
              }}
            >
              Recipients
            </Typography>
            <ToggleButtonGroup
              value={recipientType}
              exclusive
              onChange={(_, val: RecipientType | null) => {
                if (val) setRecipientType(val);
              }}
              disabled={submitting}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  borderRadius: "6px !important",
                  px: 1.75,
                  py: 0.75,
                  fontSize: 13,
                  fontWeight: 500,
                  textTransform: "none",
                  border: "1px solid rgba(0,0,0,.2)",
                  mr: 1,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "#fff",
                    borderColor: "primary.main",
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                },
              }}
            >
              <ToggleButton value="volunteers">Volunteers</ToggleButton>
              {userRole === "admin" && (
                <ToggleButton value="staff">Staff</ToggleButton>
              )}
              {userRole === "admin" && (
                <ToggleButton value="both">Staff & Volunteers</ToggleButton>
              )}
            </ToggleButtonGroup>
          </Box>

          <Divider />

          {/* Subject Field */}
          <InputBase
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onBlur={() => markTouched("subject")}
            disabled={submitting}
            error={subjectError}
            sx={{
              py: 1.5,
              fontSize: "1rem",
              color: subjectError ? "error.main" : "text.primary",
              "& input::placeholder": {
                color: subjectError ? "error.main" : "text.secondary",
                opacity: 1,
              },
            }}
            fullWidth
          />

          <Divider />

          {/* Message Body - Rich Text Editor */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
              py: 1,
            }}
            onBlur={() => markTouched("body")}
          >
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Write your message..."
              disabled={submitting}
              minHeight={250}
            />
          </Box>
        </Box>
      </Box>

      {/* Footer Toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        {/* Left side - Formatting and attachment icons */}
        <Stack direction="row" spacing={1}>
          {/* Template Button */}
          <Tooltip
            title={
              activeTemplates.length === 0
                ? userRole === "admin"
                  ? "No templates — create one in Settings"
                  : "No templates available"
                : "Use a template"
            }
          >
            <span>
              <IconButton
                onClick={handleTemplateButtonClick}
                disabled={submitting || activeTemplates.length === 0}
                size="small"
                color={selectedTemplateId === "" ? "default" : "primary"}
                aria-label="select template"
              >
                <DescriptionOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* Template Popover */}
          <Popover
            open={templatePopoverOpen}
            anchorEl={templateAnchorEl}
            onClose={handleTemplatePopoverClose}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            transformOrigin={{ vertical: "bottom", horizontal: "left" }}
            PaperProps={{
              sx: { width: 320, maxHeight: 300, overflow: "auto" },
            }}
          >
            <List dense disablePadding>
              {activeTemplates.map((template) => (
                <ListItemButton
                  key={template.id}
                  selected={template.id === selectedTemplateId}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <ListItemText
                    primary={template.name}
                    secondary={template.subject}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      fontSize: "0.875rem",
                    }}
                    secondaryTypographyProps={{
                      noWrap: true,
                      fontSize: "0.75rem",
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Popover>
        </Stack>

        {/* Right side - Cancel and Send buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            onClick={handleClose}
            disabled={submitting}
            variant="text"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            variant="contained"
            disabled={!isFormValid || submitting}
            sx={{ borderRadius: 2, px: 4 }}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {submitting ? "Sending..." : "Send"}
          </Button>
        </Stack>
      </Box>
    </MobileDialog>
  );
}
