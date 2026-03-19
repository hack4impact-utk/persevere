"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
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
import IconButton from "@mui/material/IconButton";
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
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import {
  type ChangeEvent,
  type JSX,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  type CreateDocumentInput,
  type OnboardingDocument,
  type UpdateDocumentInput,
  useOnboardingDocuments,
} from "@/hooks/use-onboarding-documents";

type SourceMode = "url" | "upload";

type FormState = {
  title: string;
  type: "pdf" | "video" | "link";
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
      } catch {
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
    } catch {
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
    } catch {
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
          Add Document
        </Button>
      </Box>

      <Typography color="text.secondary" mb={3} variant="body2">
        Manage documents volunteers must review and sign during onboarding.
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Required</TableCell>
                <TableCell>Sort Order</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2 }}
                    >
                      No documents yet. Add your first onboarding document.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {doc.title}
                    </Typography>
                    {doc.description && (
                      <Typography variant="caption" color="text.secondary">
                        {doc.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}
                    >
                      {doc.type}
                    </Typography>
                  </TableCell>
                  <TableCell>{doc.required ? "Yes" : "No"}</TableCell>
                  <TableCell>{doc.sortOrder}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(doc)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(doc)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
    </Box>
  );
}
