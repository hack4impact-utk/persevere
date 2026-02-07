"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
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
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useState } from "react";

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

export default function SkillsSettingsPage(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();

  // Skills state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
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

  // Interests state
  const [interests, setInterests] = useState<Interest[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [interestForm, setInterestForm] = useState<InterestForm>({
    name: "",
    description: "",
  });
  const [interestSaving, setInterestSaving] = useState(false);
  const [deleteInterestConfirm, setDeleteInterestConfirm] =
    useState<Interest | null>(null);

  const loadSkills = useCallback(async () => {
    setSkillsLoading(true);
    try {
      const res = await fetch("/api/staff/skills");
      if (!res.ok) throw new Error("Failed to load skills");
      const json = await res.json();
      setSkills(json.data);
    } catch {
      enqueueSnackbar("Failed to load skills", { variant: "error" });
    } finally {
      setSkillsLoading(false);
    }
  }, [enqueueSnackbar]);

  const loadInterests = useCallback(async () => {
    setInterestsLoading(true);
    try {
      const res = await fetch("/api/staff/interests");
      if (!res.ok) throw new Error("Failed to load interests");
      const json = await res.json();
      setInterests(json.data);
    } catch {
      enqueueSnackbar("Failed to load interests", { variant: "error" });
    } finally {
      setInterestsLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    void loadSkills();
    void loadInterests();
  }, [loadSkills, loadInterests]);

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
      const body: Record<string, string> = { name: skillForm.name.trim() };
      if (skillForm.description.trim())
        body.description = skillForm.description.trim();
      if (skillForm.category.trim()) body.category = skillForm.category.trim();

      const url = editingSkill
        ? `/api/staff/skills/${editingSkill.id}`
        : "/api/staff/skills";
      const method = editingSkill ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to save skill");
      }

      enqueueSnackbar(
        editingSkill
          ? "Skill updated successfully"
          : "Skill created successfully",
        { variant: "success" },
      );
      setSkillDialogOpen(false);
      void loadSkills();
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to save skill",
        { variant: "error" },
      );
    } finally {
      setSkillSaving(false);
    }
  }, [skillForm, editingSkill, enqueueSnackbar, loadSkills]);

  const handleDeleteSkill = useCallback(
    async (skill: Skill) => {
      try {
        const res = await fetch(`/api/staff/skills/${skill.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.message || "Failed to delete skill");
        }

        enqueueSnackbar("Skill deleted successfully", { variant: "success" });
        void loadSkills();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error ? error.message : "Failed to delete skill",
          { variant: "error" },
        );
      } finally {
        setDeleteSkillConfirm(null);
      }
    },
    [enqueueSnackbar, loadSkills],
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
      const body: Record<string, string> = { name: interestForm.name.trim() };
      if (interestForm.description.trim())
        body.description = interestForm.description.trim();

      const url = editingInterest
        ? `/api/staff/interests/${editingInterest.id}`
        : "/api/staff/interests";
      const method = editingInterest ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to save interest");
      }

      enqueueSnackbar(
        editingInterest
          ? "Interest updated successfully"
          : "Interest created successfully",
        { variant: "success" },
      );
      setInterestDialogOpen(false);
      void loadInterests();
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to save interest",
        { variant: "error" },
      );
    } finally {
      setInterestSaving(false);
    }
  }, [interestForm, editingInterest, enqueueSnackbar, loadInterests]);

  const handleDeleteInterest = useCallback(
    async (interest: Interest) => {
      try {
        const res = await fetch(`/api/staff/interests/${interest.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.message || "Failed to delete interest");
        }

        enqueueSnackbar("Interest deleted successfully", {
          variant: "success",
        });
        void loadInterests();
      } catch (error) {
        enqueueSnackbar(
          error instanceof Error ? error.message : "Failed to delete interest",
          { variant: "error" },
        );
      } finally {
        setDeleteInterestConfirm(null);
      }
    },
    [enqueueSnackbar, loadInterests],
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
            <Typography variant="h5" fontWeight={600}>
              Skills
            </Typography>
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
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {skills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 2 }}
                        >
                          No skills found. Add one to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    skills.map((skill) => (
                      <TableRow key={skill.id} hover>
                        <TableCell>{skill.name}</TableCell>
                        <TableCell>
                          {skill.description || (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              component="span"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {skill.category || (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              component="span"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEditSkill(skill)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteSkillConfirm(skill)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
            <Typography variant="h5" fontWeight={600}>
              Interests
            </Typography>
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
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 2 }}
                        >
                          No interests found. Add one to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    interests.map((interest) => (
                      <TableRow key={interest.id} hover>
                        <TableCell>{interest.name}</TableCell>
                        <TableCell>
                          {interest.description || (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              component="span"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEditInterest(interest)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteInterestConfirm(interest)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
