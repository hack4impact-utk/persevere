"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
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

import { ConfirmDialog } from "@/components/shared";
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
  type: string;
  category: string;
};

const TEMPLATE_TYPES = [
  { value: "email", label: "Email" },
  { value: "notification", label: "Notification" },
  { value: "announcement", label: "Announcement" },
];

const TEMPLATE_CATEGORIES = [
  { value: "onboarding", label: "Onboarding" },
  { value: "event", label: "Event" },
  { value: "reminder", label: "Reminder" },
  { value: "general", label: "General" },
];

const VARIABLE_PLACEHOLDERS = [
  { var: "{{firstName}}", desc: "Recipient's first name" },
  { var: "{{lastName}}", desc: "Recipient's last name" },
  { var: "{{email}}", desc: "Recipient's email address" },
  { var: "{{organizationName}}", desc: "Organization name" },
  { var: "{{currentDate}}", desc: "Current date" },
];

export default function EmailTemplatesPage(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const {
    templates,
    loading,
    fetchTemplates,
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
    type: "email",
    category: "general",
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
    setForm({
      name: "",
      subject: "",
      body: "",
      type: "email",
      category: "general",
    });
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((template: EmailTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
      category: template.category || "general",
    });
    setDialogOpen(true);
  }, []);

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
          type: form.type,
          category: form.category,
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
          type: form.type,
          category: form.category,
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
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
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

      <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={500}>
          Variable placeholders:
        </Typography>
        <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
          {VARIABLE_PLACEHOLDERS.map((placeholder) => (
            <li key={placeholder.var}>
              <Typography
                variant="body2"
                component="span"
                sx={{ fontFamily: "monospace", fontWeight: 600 }}
              >
                {placeholder.var}
              </Typography>
              {" - "}
              {placeholder.desc}
            </li>
          ))}
        </Box>
      </Alert>

      {loading ? (
        <LoadingSkeleton variant="lines" count={5} />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
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
                      <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                        {template.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={template.type}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    </TableCell>
                    <TableCell>
                      {template.category && (
                        <Chip
                          label={template.category}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ fontSize: "0.75rem" }}
                        />
                      )}
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
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? "Edit Template" : "Add Template"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              label="Template Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
              disabled={saving}
              helperText="A descriptive name for this template"
            />
            <TextField
              label="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              fullWidth
              required
              disabled={saving}
              helperText="Email subject line (supports variable placeholders)"
            />
            <TextField
              select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              fullWidth
              required
              disabled={saving}
            >
              {TEMPLATE_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth
              disabled={saving}
            >
              {TEMPLATE_CATEGORIES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Body *
              </Typography>
              <RichTextEditor
                value={form.body}
                onChange={(html) => setForm({ ...form, body: html })}
                placeholder="Enter the email body (supports variable placeholders and rich text formatting)..."
                disabled={saving}
                minHeight={300}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save"}
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
