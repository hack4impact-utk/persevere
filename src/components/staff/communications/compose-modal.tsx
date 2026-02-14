"use client";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  InputBase,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import {
  type ChangeEvent,
  type ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import RichTextEditor from "./rich-text-editor";
import type { Attachment, RecipientType } from "./types";

export type ComposeModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  userRole: "staff" | "admin";
};

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper to get file icon based on type
function getFileIcon(type: string): ReactElement {
  if (type === "application/pdf") {
    return <PictureAsPdfIcon sx={{ fontSize: 20, color: "#d32f2f" }} />;
  }
  return <InsertDriveFileIcon sx={{ fontSize: 20, color: "#757575" }} />;
}

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
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { enqueueSnackbar } = useSnackbar();

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validations
  const subjectError = useMemo(
    () => touched.subject && subject.trim() === "",
    [subject, touched.subject],
  );

  // Check if body has actual content (not just empty HTML tags)
  const getPlainTextContent = useCallback((html: string): string => {
    // Handle SSR and empty cases
    if (!html || globalThis.window === undefined) {
      return html || "";
    }
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

  // File attachment handlers
  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const newAttachments: Attachment[] = [];
      for (const file of files) {
        // Skip if file already attached
        if (
          attachments.some((a) => a.name === file.name && a.size === file.size)
        ) {
          continue;
        }
        newAttachments.push({
          id: `${file.name}-${file.size}-${Date.now()}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }

      setAttachments((prev) => [...prev, ...newAttachments]);

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [attachments],
  );

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
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
            // Note: attachments would be handled separately when storage is implemented
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
        setAttachments([]);
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
    setAttachments([]);
    setTouched({});
    setSubmitError(null);
    onClose();
  }, [submitting, onClose]);

  const getRecipientLabel = useCallback((type: RecipientType): string => {
    switch (type) {
      case "volunteers": {
        return "Volunteers";
      }
      case "staff": {
        return "Staff";
      }
      case "both": {
        return "Staff & Volunteers";
      }
      default: {
        return type;
      }
    }
  }, []);

  return (
    <Dialog
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
          Compose Message
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
          {/* To Field */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography
              sx={{
                color: "text.secondary",
                minWidth: 70,
                fontSize: "1rem",
              }}
            >
              To
            </Typography>
            <Select
              value={recipientType}
              onChange={(e) =>
                setRecipientType(e.target.value as RecipientType)
              }
              variant="standard"
              disabled={submitting}
              sx={{
                flex: 1,
                "& .MuiSelect-select": {
                  py: 0.5,
                },
                "&:before, &:after": {
                  display: "none",
                },
              }}
            >
              <MenuItem value="volunteers">
                {getRecipientLabel("volunteers")}
              </MenuItem>
              {userRole === "admin" && [
                <MenuItem key="staff" value="staff">
                  {getRecipientLabel("staff")}
                </MenuItem>,
                <MenuItem key="both" value="both">
                  {getRecipientLabel("both")}
                </MenuItem>,
              ]}
            </Select>
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

          {/* Attachments Display */}
          {attachments.length > 0 && (
            <Box sx={{ py: 1, flexShrink: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                {attachments.length} attachment
                {attachments.length === 1 ? "" : "s"}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {attachments.map((attachment) => (
                  <Chip
                    key={attachment.id}
                    icon={getFileIcon(attachment.type)}
                    label={
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {attachment.name.length > 20
                            ? `${attachment.name.slice(0, 17)}...`
                            : attachment.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(attachment.size)}
                        </Typography>
                      </Box>
                    }
                    onDelete={() => handleRemoveAttachment(attachment.id)}
                    variant="outlined"
                    sx={{
                      height: "auto",
                      py: 0.5,
                      "& .MuiChip-label": {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
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
          {/* Attachment Button */}
          <Tooltip title="Attach file">
            <IconButton
              onClick={handleAttachClick}
              disabled={submitting}
              size="small"
            >
              <AttachFileIcon />
            </IconButton>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </Stack>

        {/* Right side - Cancel and Send buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            onClick={handleClose}
            disabled={submitting}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isFormValid || submitting}
            sx={{ borderRadius: 2, px: 4 }}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {submitting ? "Sending..." : "Send"}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
