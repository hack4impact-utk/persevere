"use client";

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useState } from "react";

type CatalogSkill = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
};

type CatalogInterest = {
  id: number;
  name: string;
  description: string | null;
};

type CurrentSkill = {
  skillId: number;
  proficiencyLevel: string;
};

type CurrentInterest = {
  interestId: number;
};

type SkillSelection = {
  checked: boolean;
  level: "beginner" | "intermediate" | "advanced";
};

type SkillsModalProps = {
  open: boolean;
  onClose: () => void;
  volunteerId: number;
  mode: "skills" | "interests";
  currentSkills: CurrentSkill[];
  currentInterests: CurrentInterest[];
  onSaved: () => void;
};

export default function SkillsModal({
  open,
  onClose,
  volunteerId,
  mode,
  currentSkills,
  currentInterests,
  onSaved,
}: SkillsModalProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Skills mode state
  const [catalogSkills, setCatalogSkills] = useState<CatalogSkill[]>([]);
  const [skillSelections, setSkillSelections] = useState<
    Record<number, SkillSelection>
  >({});

  // Interests mode state
  const [catalogInterests, setCatalogInterests] = useState<CatalogInterest[]>(
    [],
  );
  const [interestSelections, setInterestSelections] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    if (!open) return;

    const loadCatalog = async (): Promise<void> => {
      setLoading(true);
      try {
        if (mode === "skills") {
          const res = await fetch("/api/staff/skills");
          if (!res.ok) throw new Error("Failed to load skills catalog");
          const json = await res.json();
          setCatalogSkills(json.data);

          // Initialize selections from current assignments
          const selections: Record<number, SkillSelection> = {};
          for (const skill of json.data as CatalogSkill[]) {
            const current = currentSkills.find((s) => s.skillId === skill.id);
            selections[skill.id] = {
              checked: !!current,
              level:
                (current?.proficiencyLevel as SkillSelection["level"]) ||
                "beginner",
            };
          }
          setSkillSelections(selections);
        } else {
          const res = await fetch("/api/staff/interests");
          if (!res.ok) throw new Error("Failed to load interests catalog");
          const json = await res.json();
          setCatalogInterests(json.data);

          // Initialize selections from current assignments
          const selections: Record<number, boolean> = {};
          for (const interest of json.data as CatalogInterest[]) {
            selections[interest.id] = currentInterests.some(
              (i) => i.interestId === interest.id,
            );
          }
          setInterestSelections(selections);
        }
      } catch {
        enqueueSnackbar(
          `Failed to load ${mode === "skills" ? "skills" : "interests"} catalog`,
          { variant: "error" },
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCatalog();
  }, [open, mode, currentSkills, currentInterests, enqueueSnackbar]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (mode === "skills") {
        const currentMap = new Map(
          currentSkills.map((s) => [s.skillId, s.proficiencyLevel]),
        );

        const promises: Promise<Response>[] = [];

        for (const [idStr, selection] of Object.entries(skillSelections)) {
          const skillId = Number(idStr);
          const wasAssigned = currentMap.has(skillId);

          if (selection.checked && !wasAssigned) {
            // New assignment
            promises.push(
              fetch(`/api/staff/volunteers/${volunteerId}/skills`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skillId, level: selection.level }),
              }),
            );
          } else if (selection.checked && wasAssigned) {
            // Check if level changed
            if (currentMap.get(skillId) !== selection.level) {
              promises.push(
                fetch(`/api/staff/volunteers/${volunteerId}/skills`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ skillId, level: selection.level }),
                }),
              );
            }
          } else if (!selection.checked && wasAssigned) {
            // Removal
            promises.push(
              fetch(`/api/staff/volunteers/${volunteerId}/skills/${skillId}`, {
                method: "DELETE",
              }),
            );
          }
        }

        const results = await Promise.all(promises);
        const failed = results.filter((r) => !r.ok);
        if (failed.length > 0) {
          throw new Error(`${failed.length} operation(s) failed`);
        }
      } else {
        const currentIds = new Set(currentInterests.map((i) => i.interestId));

        const promises: Promise<Response>[] = [];

        for (const [idStr, checked] of Object.entries(interestSelections)) {
          const interestId = Number(idStr);
          const wasAssigned = currentIds.has(interestId);

          if (checked && !wasAssigned) {
            promises.push(
              fetch(`/api/staff/volunteers/${volunteerId}/interests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interestId }),
              }),
            );
          } else if (!checked && wasAssigned) {
            promises.push(
              fetch(
                `/api/staff/volunteers/${volunteerId}/interests/${interestId}`,
                { method: "DELETE" },
              ),
            );
          }
        }

        const results = await Promise.all(promises);
        const failed = results.filter((r) => !r.ok);
        if (failed.length > 0) {
          throw new Error(`${failed.length} operation(s) failed`);
        }
      }

      enqueueSnackbar(
        `${mode === "skills" ? "Skills" : "Interests"} updated successfully`,
        { variant: "success" },
      );
      onSaved();
      onClose();
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : `Failed to update ${mode}`,
        { variant: "error" },
      );
    } finally {
      setSaving(false);
    }
  }, [
    mode,
    skillSelections,
    interestSelections,
    currentSkills,
    currentInterests,
    volunteerId,
    enqueueSnackbar,
    onSaved,
    onClose,
  ]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit {mode === "skills" ? "Skills" : "Interests"}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : mode === "skills" ? (
          catalogSkills.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No skills available. Add skills in Settings first.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {catalogSkills.map((skill) => (
                <Box key={skill.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={skillSelections[skill.id]?.checked || false}
                        onChange={(e) =>
                          setSkillSelections((prev) => ({
                            ...prev,
                            [skill.id]: {
                              ...prev[skill.id],
                              checked: e.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {skill.name}
                        </Typography>
                        {skill.category && (
                          <Typography variant="caption" color="text.secondary">
                            {skill.category}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  {skillSelections[skill.id]?.checked && (
                    <FormControl size="small" sx={{ ml: 4, minWidth: 150 }}>
                      <InputLabel>Level</InputLabel>
                      <Select
                        value={skillSelections[skill.id]?.level || "beginner"}
                        label="Level"
                        onChange={(e) =>
                          setSkillSelections((prev) => ({
                            ...prev,
                            [skill.id]: {
                              ...prev[skill.id],
                              level: e.target.value as SkillSelection["level"],
                            },
                          }))
                        }
                      >
                        <MenuItem value="beginner">Beginner</MenuItem>
                        <MenuItem value="intermediate">Intermediate</MenuItem>
                        <MenuItem value="advanced">Advanced</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Box>
              ))}
            </Stack>
          )
        ) : catalogInterests.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No interests available. Add interests in Settings first.
          </Typography>
        ) : (
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {catalogInterests.map((interest) => (
              <FormControlLabel
                key={interest.id}
                control={
                  <Checkbox
                    checked={interestSelections[interest.id] || false}
                    onChange={(e) =>
                      setInterestSelections((prev) => ({
                        ...prev,
                        [interest.id]: e.target.checked,
                      }))
                    }
                  />
                }
                label={interest.name}
              />
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loading}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
