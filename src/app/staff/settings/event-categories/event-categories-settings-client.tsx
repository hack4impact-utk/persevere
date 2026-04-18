"use client";

import AddIcon from "@mui/icons-material/Add";
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
  DialogTitle,
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

import { ConfirmDialog } from "@/components/shared";
import { LoadingSkeleton } from "@/components/ui";
import {
  type EventCategory,
  useEventCategories,
} from "@/hooks/use-event-categories";

type CategoryForm = { name: string };

export default function EventCategoriesSettingsClient(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const {
    allCategories,
    loading,
    fetchAllCategories,
    createCategory: hookCreateCategory,
    updateCategory: hookUpdateCategory,
    deleteCategory: hookDeleteCategory,
  } = useEventCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(
    null,
  );
  const [form, setForm] = useState<CategoryForm>({ name: "" });
  const [saving, setSaving] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] =
    useState<EventCategory | null>(null);

  useEffect(() => {
    void fetchAllCategories();
  }, [fetchAllCategories]);

  const openAdd = useCallback(() => {
    setEditingCategory(null);
    setForm({ name: "" });
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((category: EventCategory) => {
    setEditingCategory(category);
    setForm({ name: category.name });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      enqueueSnackbar("Name is required", { variant: "warning" });
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await hookUpdateCategory(editingCategory.id, {
          name: form.name.trim(),
        });
        enqueueSnackbar("Event category updated successfully", {
          variant: "success",
        });
      } else {
        await hookCreateCategory(form.name.trim());
        enqueueSnackbar("Event category created successfully", {
          variant: "success",
        });
      }
      setDialogOpen(false);
      void fetchAllCategories();
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error
          ? error.message
          : "Failed to save event category",
        { variant: "error" },
      );
    } finally {
      setSaving(false);
    }
  }, [
    form,
    editingCategory,
    enqueueSnackbar,
    hookCreateCategory,
    hookUpdateCategory,
    fetchAllCategories,
  ]);

  const handleDeactivate = useCallback(
    async (category: EventCategory) => {
      try {
        await hookDeleteCategory(category.id);
        enqueueSnackbar("Event category deactivated", { variant: "success" });
        void fetchAllCategories();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error
            ? error.message
            : "Failed to deactivate event category",
          { variant: "error" },
        );
      } finally {
        setDeactivateConfirm(null);
      }
    },
    [enqueueSnackbar, hookDeleteCategory, fetchAllCategories],
  );

  const handleReactivate = useCallback(
    async (category: EventCategory) => {
      try {
        await hookUpdateCategory(category.id, { isActive: true });
        enqueueSnackbar("Event category reactivated", { variant: "success" });
        void fetchAllCategories();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error
            ? error.message
            : "Failed to reactivate event category",
          { variant: "error" },
        );
      }
    },
    [enqueueSnackbar, hookUpdateCategory, fetchAllCategories],
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
            Event Categories
          </Typography>
          {!loading && (
            <Chip
              label={allCategories.length}
              size="small"
              color="default"
              sx={{ fontWeight: 600, height: 22, fontSize: "0.75rem" }}
            />
          )}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add Category
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
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No event categories yet.{" "}
                      <Box
                        component="span"
                        sx={{
                          cursor: "pointer",
                          color: "primary.main",
                          fontWeight: 500,
                        }}
                        onClick={openAdd}
                      >
                        Add the first category
                      </Box>{" "}
                      to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                allCategories.map((category, index) => (
                  <TableRow
                    key={category.id}
                    hover
                    sx={{
                      backgroundColor:
                        index % 2 === 0 ? "transparent" : "action.hover",
                      "&:last-child td": { border: 0 },
                      opacity: category.isActive ? 1 : 0.6,
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      {category.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={category.isActive ? "Active" : "Inactive"}
                        size="small"
                        color={category.isActive ? "success" : "default"}
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
                        <Tooltip title="Edit name">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(category)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {category.isActive ? (
                          <Tooltip title="Deactivate category">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeactivateConfirm(category)}
                            >
                              <PauseCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Reactivate category">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => void handleReactivate(category)}
                            >
                              <PlayCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      {/* Add / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingCategory ? "Edit Event Category" : "Add Event Category"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ name: e.target.value })}
            fullWidth
            required
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            variant="contained"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deactivateConfirm !== null}
        title="Deactivate Event Category"
        message={
          <>
            Deactivate <strong>{deactivateConfirm?.name}</strong>? Existing
            events with this category are unaffected, but it will no longer
            appear as an option when creating or editing events.
          </>
        }
        confirmLabel="Deactivate"
        confirmColor="error"
        onConfirm={() =>
          deactivateConfirm && void handleDeactivate(deactivateConfirm)
        }
        onClose={() => setDeactivateConfirm(null)}
      />
    </Box>
  );
}
