"use client";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
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

import {
  ConfirmDialog,
  MobileDialog,
  ModalTitleBar,
  ResponsiveTable,
} from "@/components/shared";
import { EmptyState } from "@/components/ui";
import {
  useVolunteerTypes,
  type VolunteerType,
} from "@/hooks/use-volunteer-types";

type TypeForm = { name: string };

export default function VolunteerTypesSettingsClient(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const {
    allTypes,
    loading,
    fetchAllTypes,
    createType: hookCreateType,
    updateType: hookUpdateType,
    deleteType: hookDeleteType,
  } = useVolunteerTypes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<VolunteerType | null>(null);
  const [form, setForm] = useState<TypeForm>({ name: "" });
  const [saving, setSaving] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] =
    useState<VolunteerType | null>(null);

  useEffect(() => {
    void fetchAllTypes();
  }, [fetchAllTypes]);

  const openAdd = useCallback(() => {
    setEditingType(null);
    setForm({ name: "" });
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((type: VolunteerType) => {
    setEditingType(type);
    setForm({ name: type.name });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      enqueueSnackbar("Name is required", { variant: "warning" });
      return;
    }

    setSaving(true);
    try {
      if (editingType) {
        await hookUpdateType(editingType.id, { name: form.name.trim() });
        enqueueSnackbar("Volunteer type updated successfully", {
          variant: "success",
        });
      } else {
        await hookCreateType(form.name.trim());
        enqueueSnackbar("Volunteer type created successfully", {
          variant: "success",
        });
      }
      setDialogOpen(false);
      void fetchAllTypes();
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error
          ? error.message
          : "Failed to save volunteer type",
        { variant: "error" },
      );
    } finally {
      setSaving(false);
    }
  }, [
    form,
    editingType,
    enqueueSnackbar,
    hookCreateType,
    hookUpdateType,
    fetchAllTypes,
  ]);

  const handleDeactivate = useCallback(
    async (type: VolunteerType) => {
      try {
        await hookDeleteType(type.id);
        enqueueSnackbar("Volunteer type deactivated", { variant: "success" });
        void fetchAllTypes();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error
            ? error.message
            : "Failed to deactivate volunteer type",
          { variant: "error" },
        );
      } finally {
        setDeactivateConfirm(null);
      }
    },
    [enqueueSnackbar, hookDeleteType, fetchAllTypes],
  );

  const handleReactivate = useCallback(
    async (type: VolunteerType) => {
      try {
        await hookUpdateType(type.id, { isActive: true });
        enqueueSnackbar("Volunteer type reactivated", { variant: "success" });
        void fetchAllTypes();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error
            ? error.message
            : "Failed to reactivate volunteer type",
          { variant: "error" },
        );
      }
    },
    [enqueueSnackbar, hookUpdateType, fetchAllTypes],
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
            Volunteer Types
          </Typography>
          {!loading && (
            <Chip
              label={allTypes.length}
              size="small"
              color="default"
              sx={{ fontWeight: 600, height: 22, fontSize: "0.75rem" }}
            />
          )}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add Type
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: "column",
          border: "1px solid",
          borderColor: "grey.200",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <ResponsiveTable
          desktop={
            <TableContainer sx={{ flex: 1, overflow: "auto" }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell
                      sx={{ fontWeight: 600, fontSize: "0.875rem", py: 1.5 }}
                    >
                      Name
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, fontSize: "0.875rem", py: 1.5 }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, fontSize: "0.875rem", py: 1.5 }}
                      align="right"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ p: 0, borderBottom: 0 }}>
                        <Box
                          sx={{
                            position: "absolute",
                            top: 48,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(255, 255, 255, 0.7)",
                            zIndex: 1,
                          }}
                        >
                          <CircularProgress />
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                  {allTypes.length === 0 ? (
                    loading ? null : (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                          <EmptyState
                            message="No volunteer types yet."
                            action={
                              <Box
                                component="span"
                                sx={{
                                  cursor: "pointer",
                                  color: "primary.main",
                                  fontWeight: 500,
                                }}
                                onClick={openAdd}
                              >
                                Add the first type
                              </Box>
                            }
                          />
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    allTypes.map((type, index) => (
                      <TableRow
                        key={type.id}
                        hover
                        sx={{
                          backgroundColor:
                            index % 2 === 0 ? "transparent" : "action.hover",
                          "&:last-child td": { border: 0 },
                          opacity: type.isActive ? 1 : 0.6,
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>
                          {type.name}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={type.isActive ? "Active" : "Inactive"}
                            size="small"
                            color={type.isActive ? "success" : "default"}
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
                                onClick={() => openEdit(type)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {type.isActive ? (
                              <Tooltip title="Deactivate type">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeactivateConfirm(type)}
                                >
                                  <PauseCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Reactivate type">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => void handleReactivate(type)}
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
          }
          mobile={
            <Stack spacing={1} sx={{ p: 1.5 }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : allTypes.length === 0 ? (
                <EmptyState
                  message="No volunteer types yet."
                  action={
                    <Box
                      component="span"
                      sx={{
                        cursor: "pointer",
                        color: "primary.main",
                        fontWeight: 500,
                      }}
                      onClick={openAdd}
                    >
                      Add the first type
                    </Box>
                  }
                />
              ) : (
                allTypes.map((type) => (
                  <Card
                    key={type.id}
                    variant="outlined"
                    sx={{ opacity: type.isActive ? 1 : 0.6 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        px: 1.5,
                        py: 1,
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{ flex: 1 }}
                      >
                        {type.name}
                      </Typography>
                      <Chip
                        label={type.isActive ? "Active" : "Inactive"}
                        size="small"
                        color={type.isActive ? "success" : "default"}
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
                      />
                      <Tooltip title="Edit name">
                        <IconButton size="small" onClick={() => openEdit(type)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {type.isActive ? (
                        <Tooltip title="Deactivate type">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeactivateConfirm(type)}
                          >
                            <PauseCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Reactivate type">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => void handleReactivate(type)}
                          >
                            <PlayCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Card>
                ))
              )}
            </Stack>
          }
        />
      </Paper>

      {/* Add / Edit Dialog */}
      <MobileDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <ModalTitleBar
          title={editingType ? "Edit Volunteer Type" : "Add Volunteer Type"}
          onClose={() => setDialogOpen(false)}
        />
        <DialogContent dividers>
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
      </MobileDialog>

      <ConfirmDialog
        open={deactivateConfirm !== null}
        title="Deactivate Volunteer Type"
        message={
          <>
            Deactivate <strong>{deactivateConfirm?.name}</strong>? Existing
            volunteers with this type are unaffected, but it will no longer
            appear as an option when adding or editing volunteers.
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
