"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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

import { useSkills } from "@/hooks/use-skills";

type Skill = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
};

type Interest = {
  id: number;
  name: string;
  description: string | null;
};

type SkillForm = {
  name: string;
  description: string;
  category: string;
};

type InterestForm = {
  name: string;
  description: string;
};

export default function SkillsSettingsClient(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const {
    skills,
    interests,
    isLoadingSkills: skillsLoading,
    isLoadingInterests: interestsLoading,
    fetchSkills,
    fetchInterests,
    createSkill: hookCreateSkill,
    updateSkill: hookUpdateSkill,
    deleteSkill: hookDeleteSkill,
    createInterest: hookCreateInterest,
    updateInterest: hookUpdateInterest,
    deleteInterest: hookDeleteInterest,
  } = useSkills();

  // Skills UI state
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillForm, setSkillForm] = useState<SkillForm>({
    name: "",
    description: "",
    category: "",
  });
  const [skillSaving, setSkillSaving] = useState(false);
  const [deleteSkillConfirm, setDeleteSkillConfirm] = useState<Skill | null>(
    null,
  );

  // Interests UI state
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [interestForm, setInterestForm] = useState<InterestForm>({
    name: "",
    description: "",
  });
  const [interestSaving, setInterestSaving] = useState(false);
  const [deleteInterestConfirm, setDeleteInterestConfirm] =
    useState<Interest | null>(null);

  useEffect(() => {
    void fetchSkills();
    void fetchInterests();
  }, [fetchSkills, fetchInterests]);

  // Skill handlers
  const openAddSkill = useCallback(() => {
    setEditingSkill(null);
    setSkillForm({ name: "", description: "", category: "" });
    setSkillDialogOpen(true);
  }, []);

  const openEditSkill = useCallback((skill: Skill) => {
    setEditingSkill(skill);
    setSkillForm({
      name: skill.name,
      description: skill.description || "",
      category: skill.category || "",
    });
    setSkillDialogOpen(true);
  }, []);

  const handleSaveSkill = useCallback(async () => {
    if (!skillForm.name.trim()) {
      enqueueSnackbar("Skill name is required", { variant: "warning" });
      return;
    }

    setSkillSaving(true);
    try {
      const description = skillForm.description.trim() || undefined;
      const category = skillForm.category.trim() || undefined;

      if (editingSkill) {
        await hookUpdateSkill(
          editingSkill.id,
          skillForm.name.trim(),
          description,
          category,
        );
        enqueueSnackbar("Skill updated successfully", { variant: "success" });
      } else {
        await hookCreateSkill(skillForm.name.trim(), description, category);
        enqueueSnackbar("Skill created successfully", { variant: "success" });
      }
      setSkillDialogOpen(false);
      void fetchSkills();
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to save skill",
        { variant: "error" },
      );
    } finally {
      setSkillSaving(false);
    }
  }, [
    skillForm,
    editingSkill,
    enqueueSnackbar,
    hookCreateSkill,
    hookUpdateSkill,
    fetchSkills,
  ]);

  const handleDeleteSkill = useCallback(
    async (skill: Skill) => {
      try {
        await hookDeleteSkill(skill.id);
        enqueueSnackbar("Skill deleted successfully", { variant: "success" });
        void fetchSkills();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error ? error.message : "Failed to delete skill",
          { variant: "error" },
        );
      } finally {
        setDeleteSkillConfirm(null);
      }
    },
    [enqueueSnackbar, hookDeleteSkill, fetchSkills],
  );

  // Interest handlers
  const openAddInterest = useCallback(() => {
    setEditingInterest(null);
    setInterestForm({ name: "", description: "" });
    setInterestDialogOpen(true);
  }, []);

  const openEditInterest = useCallback((interest: Interest) => {
    setEditingInterest(interest);
    setInterestForm({
      name: interest.name,
      description: interest.description || "",
    });
    setInterestDialogOpen(true);
  }, []);

  const handleSaveInterest = useCallback(async () => {
    if (!interestForm.name.trim()) {
      enqueueSnackbar("Interest name is required", { variant: "warning" });
      return;
    }

    setInterestSaving(true);
    try {
      const description = interestForm.description.trim() || undefined;

      if (editingInterest) {
        await hookUpdateInterest(
          editingInterest.id,
          interestForm.name.trim(),
          description,
        );
        enqueueSnackbar("Interest updated successfully", {
          variant: "success",
        });
      } else {
        await hookCreateInterest(interestForm.name.trim(), description);
        enqueueSnackbar("Interest created successfully", {
          variant: "success",
        });
      }
      setInterestDialogOpen(false);
      void fetchInterests();
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to save interest",
        { variant: "error" },
      );
    } finally {
      setInterestSaving(false);
    }
  }, [
    interestForm,
    editingInterest,
    enqueueSnackbar,
    hookCreateInterest,
    hookUpdateInterest,
    fetchInterests,
  ]);

  const handleDeleteInterest = useCallback(
    async (interest: Interest) => {
      try {
        await hookDeleteInterest(interest.id);
        enqueueSnackbar("Interest deleted successfully", {
          variant: "success",
        });
        void fetchInterests();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error ? error.message : "Failed to delete interest",
          { variant: "error" },
        );
      } finally {
        setDeleteInterestConfirm(null);
      }
    },
    [enqueueSnackbar, hookDeleteInterest, fetchInterests],
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        Skills & Interests Settings
      </Typography>
      <Stack spacing={4}>
        {/* Skills Section */}
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h5" fontWeight={600}>
                Skills
              </Typography>
              {!skillsLoading && (
                <Chip
                  label={skills.length}
                  size="small"
                  color="default"
                  sx={{ fontWeight: 600, height: 22, fontSize: "0.75rem" }}
                />
              )}
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAddSkill}
              sx={{ textTransform: "none" }}
            >
              Add Skill
            </Button>
          </Box>

          {skillsLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                      Description
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                      Category
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {skills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" color="text.secondary">
                          No skills yet.{" "}
                          <Box
                            component="span"
                            sx={{
                              cursor: "pointer",
                              color: "primary.main",
                              fontWeight: 500,
                            }}
                            onClick={openAddSkill}
                          >
                            Add the first skill
                          </Box>{" "}
                          to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    skills.map((skill, index) => (
                      <TableRow
                        key={skill.id}
                        hover
                        sx={{
                          backgroundColor:
                            index % 2 === 0 ? "transparent" : "action.hover",
                          "&:last-child td": { border: 0 },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>
                          {skill.name}
                        </TableCell>
                        <TableCell
                          sx={{ color: "text.secondary", maxWidth: 300 }}
                        >
                          {skill.description ?? "—"}
                        </TableCell>
                        <TableCell>
                          {skill.category ? (
                            <Chip
                              label={skill.category}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.75rem" }}
                            />
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.disabled"
                              component="span"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                          >
                            <Tooltip title="Edit skill">
                              <IconButton
                                size="small"
                                onClick={() => openEditSkill(skill)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete skill">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteSkillConfirm(skill)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Interests Section */}
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h5" fontWeight={600}>
                Interests
              </Typography>
              {!interestsLoading && (
                <Chip
                  label={interests.length}
                  size="small"
                  color="default"
                  sx={{ fontWeight: 600, height: 22, fontSize: "0.75rem" }}
                />
              )}
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAddInterest}
              sx={{ textTransform: "none" }}
            >
              Add Interest
            </Button>
          </Box>

          {interestsLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                      Description
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" color="text.secondary">
                          No interests yet.{" "}
                          <Box
                            component="span"
                            sx={{
                              cursor: "pointer",
                              color: "primary.main",
                              fontWeight: 500,
                            }}
                            onClick={openAddInterest}
                          >
                            Add the first interest
                          </Box>{" "}
                          to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    interests.map((interest, index) => (
                      <TableRow
                        key={interest.id}
                        hover
                        sx={{
                          backgroundColor:
                            index % 2 === 0 ? "transparent" : "action.hover",
                          "&:last-child td": { border: 0 },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>
                          {interest.name}
                        </TableCell>
                        <TableCell
                          sx={{ color: "text.secondary", maxWidth: 400 }}
                        >
                          {interest.description ?? "—"}
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                          >
                            <Tooltip title="Edit interest">
                              <IconButton
                                size="small"
                                onClick={() => openEditInterest(interest)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete interest">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  setDeleteInterestConfirm(interest)
                                }
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Stack>
      {/* Skill Add/Edit Dialog */}
      <Dialog
        open={skillDialogOpen}
        onClose={() => setSkillDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingSkill ? "Edit Skill" : "Add Skill"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={skillForm.name}
              onChange={(e) =>
                setSkillForm((f) => ({ ...f, name: e.target.value }))
              }
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Description"
              value={skillForm.description}
              onChange={(e) =>
                setSkillForm((f) => ({ ...f, description: e.target.value }))
              }
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Category"
              value={skillForm.category}
              onChange={(e) =>
                setSkillForm((f) => ({ ...f, category: e.target.value }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSkillDialogOpen(false)}
            disabled={skillSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSkill}
            variant="contained"
            disabled={skillSaving}
          >
            {skillSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Interest Add/Edit Dialog */}
      <Dialog
        open={interestDialogOpen}
        onClose={() => setInterestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingInterest ? "Edit Interest" : "Add Interest"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={interestForm.name}
              onChange={(e) =>
                setInterestForm((f) => ({ ...f, name: e.target.value }))
              }
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Description"
              value={interestForm.description}
              onChange={(e) =>
                setInterestForm((f) => ({ ...f, description: e.target.value }))
              }
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setInterestDialogOpen(false)}
            disabled={interestSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveInterest}
            variant="contained"
            disabled={interestSaving}
          >
            {interestSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Skill Confirmation */}
      <Dialog
        open={deleteSkillConfirm !== null}
        onClose={() => setDeleteSkillConfirm(null)}
      >
        <DialogTitle>Delete Skill</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the skill{" "}
            <strong>{deleteSkillConfirm?.name}</strong>? This will fail if the
            skill is currently assigned to any volunteers.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSkillConfirm(null)}>Cancel</Button>
          <Button
            onClick={() =>
              deleteSkillConfirm && handleDeleteSkill(deleteSkillConfirm)
            }
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Interest Confirmation */}
      <Dialog
        open={deleteInterestConfirm !== null}
        onClose={() => setDeleteInterestConfirm(null)}
      >
        <DialogTitle>Delete Interest</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the interest{" "}
            <strong>{deleteInterestConfirm?.name}</strong>? This will fail if
            the interest is currently assigned to any volunteers.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteInterestConfirm(null)}>Cancel</Button>
          <Button
            onClick={() =>
              deleteInterestConfirm &&
              handleDeleteInterest(deleteInterestConfirm)
            }
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
