"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useState } from "react";

import { ConfirmDialog, ModalTitleBar } from "@/components/shared";
import RichTextEditor from "@/components/staff/communications/rich-text-editor";
import { LoadingSkeleton } from "@/components/ui";
import {
  type CreateTemplateInput,
  type EmailTemplate,
  type UpdateTemplateInput,
  useEmailTemplates,
} from "@/hooks/use-email-templates";

type TemplateForm = {
  name: string;
  subject: string;
  body: string;
};

export default function EmailTemplatesSettingsClient(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const {
    allTemplates: templates,
    loading,
    fetchAllTemplates: fetchTemplates,
    createTemplate: hookCreateTemplate,
    updateTemplate: hookUpdateTemplate,
    deleteTemplate: hookDeleteTemplate,
  } = useEmailTemplates();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [form, setForm] = useState<TemplateForm>({
    name: "",
    subject: "",
    body: "",
  });
  const [saving, setSaving] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] =
    useState<EmailTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<EmailTemplate | null>(
    null,
  );

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const openAdd = useCallback(() => {
    setEditingTemplate(null);
    setForm({ name: "", subject: "", body: "" });
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((template: EmailTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
    });
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    if (!saving) setDialogOpen(false);
  }, [saving]);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      enqueueSnackbar("Name is required", { variant: "warning" });
      return;
    }
    if (!form.subject.trim()) {
      enqueueSnackbar("Subject is required", { variant: "warning" });
      return;
    }
    if (!form.body.trim()) {
      enqueueSnackbar("Body is required", { variant: "warning" });
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        const input: UpdateTemplateInput = {
          name: form.name.trim(),
          subject: form.subject.trim(),
          body: form.body.trim(),
        };
        await hookUpdateTemplate(editingTemplate.id, input);
        enqueueSnackbar("Template updated successfully", {
          variant: "success",
        });
      } else {
        const input: CreateTemplateInput = {
          name: form.name.trim(),
          subject: form.subject.trim(),
          body: form.body.trim(),
          type: "email",
        };
        await hookCreateTemplate(input);
        enqueueSnackbar("Template created successfully", {
          variant: "success",
        });
      }
      setDialogOpen(false);
      void fetchTemplates();
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to save template",
        { variant: "error" },
      );
    } finally {
      setSaving(false);
    }
  }, [
    form,
    editingTemplate,
    enqueueSnackbar,
    hookCreateTemplate,
    hookUpdateTemplate,
    fetchTemplates,
  ]);

  const handleDeactivate = useCallback(
    async (template: EmailTemplate) => {
      try {
        await hookUpdateTemplate(template.id, { isActive: false });
        enqueueSnackbar("Template deactivated", { variant: "success" });
        void fetchTemplates();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error
            ? error.message
            : "Failed to deactivate template",
          { variant: "error" },
        );
      } finally {
        setDeactivateConfirm(null);
      }
    },
    [enqueueSnackbar, hookUpdateTemplate, fetchTemplates],
  );

  const handleReactivate = useCallback(
    async (template: EmailTemplate) => {
      try {
        await hookUpdateTemplate(template.id, { isActive: true });
        enqueueSnackbar("Template reactivated", { variant: "success" });
        void fetchTemplates();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error
            ? error.message
            : "Failed to reactivate template",
          { variant: "error" },
        );
      }
    },
    [enqueueSnackbar, hookUpdateTemplate, fetchTemplates],
  );

  const handleDelete = useCallback(
    async (template: EmailTemplate) => {
      try {
        await hookDeleteTemplate(template.id);
        enqueueSnackbar("Template deleted", { variant: "success" });
        void fetchTemplates();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error ? error.message : "Failed to delete template",
          { variant: "error" },
        );
      } finally {
        setDeleteConfirm(null);
      }
    },
    [enqueueSnackbar, hookDeleteTemplate, fetchTemplates],
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5" fontWeight={600}>
            Email Templates
          </Typography>
          {!loading && (
            <Chip
              label={templates.length}
              size="small"
              color="default"
              sx={{ fontWeight: 600, height: 22, fontSize: "0.75rem" }}
            />
          )}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add Template
        </Button>
      </Box>

      {loading ? (
        <LoadingSkeleton variant="lines" count={5} />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No email templates yet.{" "}
                      <Box
                        component="span"
                        sx={{
                          cursor: "pointer",
                          color: "primary.main",
                          fontWeight: 500,
                        }}
                        onClick={openAdd}
                      >
                        Add the first template
                      </Box>{" "}
                      to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template, index) => (
                  <TableRow
                    key={template.id}
                    hover
                    sx={{
                      backgroundColor:
                        index % 2 === 0 ? "transparent" : "action.hover",
                      "&:last-child td": { border: 0 },
                      opacity: template.isActive ? 1 : 0.6,
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      {template.name}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 350 }}>
                        {template.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={template.isActive ? "Active" : "Inactive"}
                        size="small"
                        color={template.isActive ? "success" : "default"}
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Tooltip title="Edit template">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(template)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {template.isActive ? (
                          <Tooltip title="Deactivate template">
                            <IconButton
                              size="small"
                              onClick={() => setDeactivateConfirm(template)}
                            >
                              <PauseCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <>
                            <Tooltip title="Reactivate template">
                              <IconButton
                                size="small"
                                onClick={() => handleReactivate(template)}
                              >
                                <PlayCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete template">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteConfirm(template)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <ModalTitleBar
          title={editingTemplate ? "Edit Template" : "Add Template"}
          onClose={closeDialog}
        />
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              label="Template Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
              disabled={saving}
            />
            <TextField
              label="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              fullWidth
              required
              disabled={saving}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Body{" "}
                <Box component="span" sx={{ color: "error.main" }}>
                  *
                </Box>
              </Typography>
              <RichTextEditor
                value={form.body}
                onChange={(html) => setForm({ ...form, body: html })}
                placeholder="Enter the email body..."
                disabled={saving}
                minHeight={300}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        open={Boolean(deactivateConfirm)}
        title="Deactivate Template"
        message={`Are you sure you want to deactivate "${deactivateConfirm?.name}"? It will no longer be available for selection in the compose modal.`}
        confirmLabel="Deactivate"
        onConfirm={() =>
          deactivateConfirm && handleDeactivate(deactivateConfirm)
        }
        onClose={() => setDeactivateConfirm(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Delete Template"
        message={`Are you sure you want to permanently delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
      />
    </Box>
  );
}
