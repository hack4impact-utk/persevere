"use client";

import AddIcon from "@mui/icons-material/Add";
import LinkIcon from "@mui/icons-material/Link";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import {
  type ChangeEvent,
  type JSX,
  useCallback,
  useEffect,
  useState,
} from "react";

import { ModalTitleBar } from "@/components/shared";
import OnboardingModuleCard from "@/components/shared/onboarding-module-card";
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
  sortOrder: string;
};

const DEFAULT_FORM: FormState = {
  title: "",
  type: "link",
  actionType: "sign",
  sourceMode: "url",
  url: "",
  file: null,
  description: "",
  required: false,
  sortOrder: "0",
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
      sortOrder: String(doc.sortOrder),
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

  useEffect(() => {
    if (form.actionType === "informational") {
      setForm((prev) => ({ ...prev, required: false }));
    }
  }, [form.actionType]);

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
        required: form.required,
        sortOrder: Number(form.sortOrder) || 0,
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

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" fontWeight={600}>
          Onboarding Documents
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          size="small"
        >
          Add Content
        </Button>
      </Box>

      <Typography color="text.secondary" mb={3} variant="body2">
        Manage onboarding content — documents to sign, consent forms,
        acknowledgements, and informational resources.
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {documents.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 4, textAlign: "center" }}
              >
                No documents yet. Add your first onboarding module.
              </Typography>
            </Grid>
          )}
          {documents.map((doc) => (
            <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <OnboardingModuleCard
                title={doc.title}
                description={doc.description || undefined}
                icon={
                  doc.type === "pdf" ? (
                    <PictureAsPdfIcon />
                  ) : doc.type === "video" ? (
                    <OndemandVideoIcon />
                  ) : (
                    <LinkIcon />
                  )
                }
                onEdit={() => openEdit(doc)}
                onClick={() => setPreviewTarget(doc)}
                onDelete={() => setDeleteTarget(doc)}
                statusNode={
                  <Box display="flex" gap={1} mt={1}>
                    {doc.required && (
                      <Box
                        component="span"
                        sx={{
                          fontSize: "0.7rem",
                          px: 1,
                          py: 0.25,
                          bgcolor: "error.main",
                          color: "error.contrastText",
                          borderRadius: 1,
                          fontWeight: 600,
                        }}
                      >
                        REQUIRED
                      </Box>
                    )}
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.7rem",
                        px: 1,
                        py: 0.25,
                        bgcolor: "grey.200",
                        color: "text.primary",
                        borderRadius: 1,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {doc.actionType}
                    </Box>
                  </Box>
                }
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editTarget ? "Edit Document" : "Add Document"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              fullWidth
              size="small"
              required
            />

            <FormControl fullWidth size="small">
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

            <FormControl fullWidth size="small">
              <InputLabel>Action Type</InputLabel>
              <Select
                value={form.actionType}
                label="Action Type"
                onChange={(e) =>
                  setField("actionType", e.target.value as ActionType)
                }
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

            <FormControl fullWidth size="small">
              <InputLabel>Source</InputLabel>
              <Select
                value={form.sourceMode}
                label="Source"
                onChange={(e) => {
                  setField("sourceMode", e.target.value as SourceMode);
                  setField("url", "");
                  setField("file", null);
                }}
              >
                <MenuItem value="url">External URL</MenuItem>
                <MenuItem value="upload">Upload File</MenuItem>
              </Select>
            </FormControl>

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
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={0.5}
                >
                  PDF or video file (mp4, webm)
                </Typography>
                <input
                  type="file"
                  accept=".pdf,video/mp4,video/webm"
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
              rows={2}
            />

            <Box display="flex" gap={2} alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.required}
                    onChange={(e) => setField("required", e.target.checked)}
                    disabled={form.actionType === "informational"}
                  />
                }
                label="Required"
              />
              <TextField
                label="Sort Order"
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", e.target.value)}
                size="small"
                type="number"
                sx={{ width: 120 }}
              />
            </Box>
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
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
            This will also remove all volunteer signatures for this document.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Modal */}
      <Dialog
        open={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        maxWidth="lg"
        fullWidth
      >
        <ModalTitleBar
          title={previewTarget?.title || "Document Preview"}
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
      </Dialog>
    </Box>
  );
}
