"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import {
  type ChangeEvent,
  type JSX,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ConfirmDialog,
  MobileDialog,
  ModalTitleBar,
  PageHeader,
} from "@/components/shared";
import { EmptyState } from "@/components/ui";
import {
  type CreateDocumentInput,
  type OnboardingDocument,
  type UpdateDocumentInput,
  useOnboardingDocuments,
} from "@/hooks/use-onboarding-documents";

type SourceMode = "url" | "upload";
type ActionType = "sign" | "consent" | "acknowledge" | "informational";

type FormState = {
  title: string;
  type: "pdf" | "video" | "link";
  actionType: ActionType;
  sourceMode: SourceMode;
  url: string;
  file: File | null;
  description: string;
  required: boolean;
};

const DEFAULT_FORM: FormState = {
  title: "",
  type: "link",
  actionType: "sign",
  sourceMode: "url",
  url: "",
  file: null,
  description: "",
  required: true,
};

const TYPE_COLOR: Record<string, string> = {
  pdf: "#d32f2f",
  video: "#6a1b9a",
  link: "#327bf7",
};

const TYPE_LABEL: Record<string, string> = {
  pdf: "PDF",
  video: "VIDEO",
  link: "LINK",
};

const ACTION_CHIP_COLOR: Record<ActionType, "primary" | "warning" | "default"> =
  {
    sign: "primary",
    consent: "warning",
    acknowledge: "default",
    informational: "default",
  };

export default function DocumentManager(): JSX.Element {
  const {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    uploadFile,
    refetch,
  } = useOnboardingDocuments();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OnboardingDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OnboardingDocument | null>(
    null,
  );
  const [previewTarget, setPreviewTarget] = useState<OnboardingDocument | null>(
    null,
  );
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const openAdd = useCallback((): void => {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((doc: OnboardingDocument): void => {
    setEditTarget(doc);
    setForm({
      title: doc.title,
      type: doc.type as "pdf" | "video" | "link",
      actionType: (doc.actionType as ActionType) ?? "sign",
      sourceMode: "url",
      url: doc.url,
      file: null,
      description: doc.description ?? "",
      required: doc.required,
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback((): void => {
    setModalOpen(false);
    setEditTarget(null);
  }, []);

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]): void => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSave = useCallback(async (): Promise<void> => {
    if (!form.title.trim()) {
      enqueueSnackbar("Title is required", { variant: "error" });
      return;
    }

    let resolvedUrl = form.url.trim();

    if (form.sourceMode === "upload") {
      if (!form.file) {
        enqueueSnackbar("Please select a file to upload", { variant: "error" });
        return;
      }
      setSaving(true);
      try {
        resolvedUrl = await uploadFile(form.file);
      } catch (error_) {
        console.error("File upload failed:", error_);
        enqueueSnackbar("File upload failed", { variant: "error" });
        setSaving(false);
        return;
      }
    } else {
      if (!resolvedUrl) {
        enqueueSnackbar("URL is required", { variant: "error" });
        return;
      }
      setSaving(true);
    }

    try {
      const payload: CreateDocumentInput = {
        title: form.title.trim(),
        type: form.type,
        actionType: form.actionType,
        url: resolvedUrl,
        description: form.description.trim() || undefined,
        required: form.actionType === "informational" ? false : form.required,
      };

      if (editTarget) {
        const updatePayload: UpdateDocumentInput = payload;
        await updateDocument(editTarget.id, updatePayload);
        enqueueSnackbar("Document updated", { variant: "success" });
      } else {
        await createDocument(payload);
        enqueueSnackbar("Document created", { variant: "success" });
      }

      closeModal();
    } catch (error_) {
      console.error("Document save failed:", error_);
      enqueueSnackbar(
        editTarget ? "Failed to update document" : "Failed to create document",
        { variant: "error" },
      );
    } finally {
      setSaving(false);
    }
  }, [
    form,
    editTarget,
    uploadFile,
    createDocument,
    updateDocument,
    closeModal,
    enqueueSnackbar,
  ]);

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      enqueueSnackbar("Document deleted", { variant: "success" });
      setDeleteTarget(null);
    } catch (error_) {
      console.error("Document delete failed:", error_);
      enqueueSnackbar("Failed to delete document", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, deleteDocument, enqueueSnackbar]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const filtered = documents.filter((doc) => {
    const matchSearch = doc.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchFilter = !actionFilter || doc.actionType === actionFilter;
    return matchSearch && matchFilter;
  });

  return (
    <Box>
      <PageHeader
        eyebrow="Staff Portal"
        title="Onboarding Documents"
        subtitle="Manage onboarding content — documents to sign, consent forms, acknowledgements, and resources."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add Content
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Action type</InputLabel>
          <Select
            value={actionFilter}
            label="Action type"
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="sign">Sign</MenuItem>
            <MenuItem value="consent">Consent</MenuItem>
            <MenuItem value="acknowledge">Acknowledge</MenuItem>
            <MenuItem value="informational">Informational</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Card
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <TableContainer sx={{ position: "relative" }}>
          {loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.8)",
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell
                  sx={{ pl: 3, fontWeight: 600, fontSize: "0.875rem" }}
                >
                  Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Action Type
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Required
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((doc) => (
                  <TableRow
                    key={doc.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => setPreviewTarget(doc)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Preview ${doc.title}`}
                  >
                    <TableCell sx={{ pl: 3 }}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box
                          sx={{
                            width: 32,
                            height: 40,
                            borderRadius: 0.5,
                            bgcolor: TYPE_COLOR[doc.type] ?? "#666",
                            color: "#fff",
                            fontSize: 9,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            letterSpacing: "0.03em",
                          }}
                        >
                          {TYPE_LABEL[doc.type] ?? doc.type.toUpperCase()}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {doc.title}
                          </Typography>
                          {doc.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                              noWrap
                            >
                              {doc.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.actionType}
                        size="small"
                        color={
                          ACTION_CHIP_COLOR[doc.actionType as ActionType] ??
                          "default"
                        }
                        sx={{ textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={doc.required ? "text.primary" : "text.disabled"}
                      >
                        {doc.required ? "Yes" : "No"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTarget(doc);
                          }}
                          aria-label="Preview"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(doc);
                          }}
                          aria-label="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(doc);
                          }}
                          aria-label="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : loading ? null : (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState
                      message={
                        searchQuery || actionFilter
                          ? "No documents match your filters."
                          : "No documents yet. Add your first onboarding module."
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add / Edit Modal */}
      <MobileDialog
        open={modalOpen}
        onClose={closeModal}
        maxWidth="sm"
        fullWidth
      >
        <ModalTitleBar
          title={editTarget ? "Edit Document" : "Add Document"}
          onClose={closeModal}
        />
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                fullWidth
                size="small"
                required
              />
              <FormControl sx={{ minWidth: { sm: 140 } }} size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.type}
                  label="Type"
                  onChange={(e) =>
                    setField("type", e.target.value as FormState["type"])
                  }
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="link">Link</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
                bgcolor: "grey.50",
              }}
            >
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Action Type</InputLabel>
                  <Select
                    value={form.actionType}
                    label="Action Type"
                    onChange={(e) => {
                      const val = e.target.value as ActionType;
                      setForm((prev) => ({
                        ...prev,
                        actionType: val,
                        required:
                          val === "informational" ? false : prev.required,
                      }));
                    }}
                  >
                    <MenuItem value="sign">Sign (formal agreement)</MenuItem>
                    <MenuItem value="consent">Consent (give/deny)</MenuItem>
                    <MenuItem value="acknowledge">
                      Acknowledge (confirm reviewed)
                    </MenuItem>
                    <MenuItem value="informational">
                      Informational (view only)
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.required}
                      onChange={(e) => setField("required", e.target.checked)}
                      disabled={form.actionType === "informational"}
                      sx={{ "& .MuiSvgIcon-root": { fontSize: 20 } }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      color={
                        form.actionType === "informational"
                          ? "text.disabled"
                          : "text.primary"
                      }
                    >
                      Required document (volunteers must complete this to
                      complete onboarding)
                    </Typography>
                  }
                />
              </Stack>
            </Box>

            <Stack spacing={1}>
              <Typography
                variant="body2"
                fontWeight={500}
                color="text.secondary"
              >
                Document Source
              </Typography>
              <ToggleButtonGroup
                value={form.sourceMode}
                exclusive
                onChange={(_e, val) => {
                  if (val !== null) {
                    setField("sourceMode", val as SourceMode);
                    setField("url", "");
                    setField("file", null);
                  }
                }}
                fullWidth
                size="small"
              >
                <ToggleButton value="upload">Upload File</ToggleButton>
                <ToggleButton value="url">External Link</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {form.sourceMode === "url" ? (
              <TextField
                label="URL"
                value={form.url}
                onChange={(e) => setField("url", e.target.value)}
                fullWidth
                size="small"
                placeholder="https://..."
              />
            ) : (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: "2px dashed",
                  borderColor: form.file ? "success.main" : "primary.main",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: form.file ? "success.50" : "transparent",
                  "&:hover": {
                    backgroundColor: form.file ? "success.50" : "action.hover",
                    opacity: 0.9,
                  },
                }}
              >
                <UploadFileIcon
                  sx={{
                    fontSize: 32,
                    color: form.file ? "success.main" : "primary.main",
                    mb: 1,
                  }}
                />
                {form.file ? (
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="success.main"
                    >
                      File selected: {form.file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(form.file.size / (1024 * 1024)).toFixed(2)} MB • Click
                      to change file
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Drag &amp; drop your file here, or click to browse
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Accepts PDF or video file (mp4, webm)
                    </Typography>
                  </Box>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,video/mp4,video/webm"
                  style={{ display: "none" }}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setField("file", e.target.files?.[0] ?? null)
                  }
                />
              </Box>
            )}

            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editTarget ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </MobileDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also remove all volunteer signatures for this document.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Preview Modal */}
      <MobileDialog
        open={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        maxWidth="lg"
        fullWidth
      >
        <ModalTitleBar
          title={previewTarget?.title ?? "Document Preview"}
          onClose={() => setPreviewTarget(null)}
        />
        {previewTarget && (
          <DialogContent
            dividers
            sx={
              previewTarget.type === "link"
                ? {}
                : {
                    p: 0,
                    bgcolor:
                      previewTarget.type === "video" ? "black" : "grey.100",
                  }
            }
          >
            {previewTarget.type === "pdf" && (
              <Box sx={{ height: "80vh", width: "100%" }}>
                <iframe
                  src={previewTarget.url}
                  title={previewTarget.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                  }}
                />
              </Box>
            )}

            {previewTarget.type === "video" && (
              <Box
                sx={{
                  height: "80vh",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <video
                  src={previewTarget.url}
                  controls
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    display: "block",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                />
              </Box>
            )}

            {previewTarget.type === "link" && (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1.5}
                py={4}
              >
                <Typography variant="body2" color="text.secondary">
                  This document opens in a new tab.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<OpenInNewIcon />}
                  href={previewTarget.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  component="a"
                >
                  Open Link
                </Button>
              </Box>
            )}
          </DialogContent>
        )}
      </MobileDialog>
    </Box>
  );
}
