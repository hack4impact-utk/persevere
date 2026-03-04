"use client";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useState } from "react";

import { useVolunteerSkillsInterests } from "@/hooks/use-volunteer-skills-interests";

import AvailabilityEditor, {
  type AvailabilityData,
  validateRanges,
} from "./availability-editor";

type SkillData = {
  skillId: number;
  skillName: string | null;
  skillDescription: string | null;
  skillCategory: string | null;
  proficiencyLevel: "beginner" | "intermediate" | "advanced" | null;
};

type InterestData = {
  interestId: number;
  interestName: string | null;
  interestDescription: string | null;
};

type ProfileData = {
  phone?: string | null;
  bio?: string | null;
  availability?: AvailabilityData | null;
  notificationPreference?: "email" | "sms" | "both" | "none" | null;
  skills?: SkillData[];
  interests?: InterestData[];
};

type ProfileEditFormProps = {
  initialData: ProfileData;
  onSave: (data: ProfileData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
};

function SectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      variant="caption"
      fontWeight={700}
      letterSpacing={0.8}
      color="text.secondary"
      sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
    >
      {children}
    </Typography>
  );
}

/**
 * ProfileEditForm
 *
 * Self-service form for volunteers to edit their own profile.
 * Restricted to: phone, bio, availability, notification preference, skills, interests.
 */
export default function ProfileEditForm({
  initialData,
  onSave,
  onCancel,
  loading = false,
}: ProfileEditFormProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const {
    skills: catalogSkills,
    interests: catalogInterests,
    isLoadingSkills,
    isLoadingInterests,
    fetchSkills,
    fetchInterests,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
  } = useVolunteerSkillsInterests();

  const [formData, setFormData] = useState<ProfileData>({
    phone: initialData.phone || "",
    bio: initialData.bio || "",
    availability: initialData.availability || {},
    notificationPreference: initialData.notificationPreference || "email",
  });

  // Local skills state: map of skillId -> {checked, level}
  const [skillSelections, setSkillSelections] = useState<
    Record<
      number,
      { checked: boolean; level: "beginner" | "intermediate" | "advanced" }
    >
  >({});

  // Local interests state: map of interestId -> checked
  const [interestSelections, setInterestSelections] = useState<
    Record<number, boolean>
  >({});

  const [savingSkillsInterests, setSavingSkillsInterests] = useState(false);

  // Load catalogs on mount
  useEffect(() => {
    void fetchSkills();
    void fetchInterests();
  }, [fetchSkills, fetchInterests]);

  // Initialize selections when catalog loads
  useEffect(() => {
    if (catalogSkills.length > 0) {
      const selections: typeof skillSelections = {};
      for (const skill of catalogSkills) {
        const current = initialData.skills?.find((s) => s.skillId === skill.id);
        selections[skill.id] = {
          checked: !!current,
          level: current?.proficiencyLevel || "beginner",
        };
      }
      setSkillSelections(selections);
    }
  }, [catalogSkills, initialData.skills]);

  useEffect(() => {
    if (catalogInterests.length > 0) {
      const selections: typeof interestSelections = {};
      for (const interest of catalogInterests) {
        selections[interest.id] =
          initialData.interests?.some((i) => i.interestId === interest.id) ||
          false;
      }
      setInterestSelections(selections);
    }
  }, [catalogInterests, initialData.interests]);

  const hasAvailabilityErrors = Object.values(formData.availability ?? {}).some(
    (ranges) => ranges != null && validateRanges(ranges) !== null,
  );

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSavingSkillsInterests(true);
    try {
      // Save skills and interests changes first
      const currentSkillsMap = new Map(
        initialData.skills?.map((s) => [s.skillId, s.proficiencyLevel]) || [],
      );
      const currentInterestsSet = new Set(
        initialData.interests?.map((i) => i.interestId) || [],
      );

      const skillPromises: Promise<void>[] = [];
      const interestPromises: Promise<void>[] = [];

      // Process skills
      for (const [idStr, selection] of Object.entries(skillSelections)) {
        const skillId = Number(idStr);
        const wasAssigned = currentSkillsMap.has(skillId);

        if (selection.checked && !wasAssigned) {
          skillPromises.push(addSkill(skillId, selection.level));
        } else if (selection.checked && wasAssigned) {
          if (currentSkillsMap.get(skillId) !== selection.level) {
            skillPromises.push(addSkill(skillId, selection.level));
          }
        } else if (!selection.checked && wasAssigned) {
          skillPromises.push(removeSkill(skillId));
        }
      }

      // Process interests
      for (const [idStr, checked] of Object.entries(interestSelections)) {
        const interestId = Number(idStr);
        const wasAssigned = currentInterestsSet.has(interestId);

        if (checked && !wasAssigned) {
          interestPromises.push(addInterest(interestId));
        } else if (!checked && wasAssigned) {
          interestPromises.push(removeInterest(interestId));
        }
      }

      await Promise.all([...skillPromises, ...interestPromises]);

      // Then save profile data
      await onSave(formData);
    } catch (error) {
      console.error("[ProfileEditForm] onSave rejected unexpectedly:", error);
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to save changes",
        { variant: "error" },
      );
    } finally {
      setSavingSkillsInterests(false);
    }
  };

  const toggleSkill = useCallback((skillId: number): void => {
    setSkillSelections((prev) => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        checked: !prev[skillId]?.checked,
      },
    }));
  }, []);

  const updateSkillLevel = useCallback(
    (
      skillId: number,
      level: "beginner" | "intermediate" | "advanced",
    ): void => {
      setSkillSelections((prev) => ({
        ...prev,
        [skillId]: {
          ...prev[skillId],
          level,
        },
      }));
    },
    [],
  );

  const toggleInterest = useCallback((interestId: number): void => {
    setInterestSelections((prev) => ({
      ...prev,
      [interestId]: !prev[interestId],
    }));
  }, []);

  const isSaving = loading || savingSkillsInterests;

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4} sx={{ maxWidth: 560, mx: "auto" }}>
        {/* ── Contact ──────────────────────────────────── */}
        <Box>
          <SectionLabel>Contact</SectionLabel>
          <TextField
            label="Phone Number"
            value={formData.phone || ""}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            fullWidth
            placeholder="(555) 123-4567"
            disabled={isSaving}
            size="small"
          />
        </Box>

        {/* ── About ────────────────────────────────────── */}
        <Box>
          <SectionLabel>About Me</SectionLabel>
          <TextField
            label="Bio"
            value={formData.bio || ""}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            fullWidth
            multiline
            rows={3}
            placeholder="Tell us about yourself..."
            disabled={isSaving}
            size="small"
          />
        </Box>

        {/* ── Notifications ────────────────────────────── */}
        <Box>
          <SectionLabel>Notifications</SectionLabel>
          <FormControl fullWidth disabled={isSaving} size="small">
            <InputLabel id="notification-preference-label">
              How would you like to be notified?
            </InputLabel>
            <Select
              labelId="notification-preference-label"
              label="How would you like to be notified?"
              value={formData.notificationPreference || "email"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notificationPreference: e.target.value as
                    | "email"
                    | "sms"
                    | "both"
                    | "none",
                })
              }
            >
              <MenuItem value="email">Email only</MenuItem>
              <MenuItem value="sms">SMS only</MenuItem>
              <MenuItem value="both">Email & SMS</MenuItem>
              <MenuItem value="none">None</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* ── Skills ───────────────────────────────────── */}
        <Box>
          <SectionLabel>Skills</SectionLabel>
          {isLoadingSkills ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {catalogSkills.map((skill) => {
                const selection = skillSelections[skill.id];
                const isChecked = selection?.checked || false;
                return (
                  <Box
                    key={skill.id}
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                  >
                    <Chip
                      label={skill.name}
                      onClick={() => toggleSkill(skill.id)}
                      color={isChecked ? "primary" : "default"}
                      variant={isChecked ? "filled" : "outlined"}
                      sx={{
                        cursor: "pointer",
                        minWidth: 120,
                        "& .MuiChip-label": { fontWeight: 500 },
                      }}
                    />
                    {isChecked && (
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={selection?.level || "beginner"}
                          onChange={(e) =>
                            updateSkillLevel(
                              skill.id,
                              e.target.value as
                                | "beginner"
                                | "intermediate"
                                | "advanced",
                            )
                          }
                          disabled={isSaving}
                        >
                          <MenuItem value="beginner">Beginner</MenuItem>
                          <MenuItem value="intermediate">Intermediate</MenuItem>
                          <MenuItem value="advanced">Advanced</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                );
              })}
              {catalogSkills.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No skills available
                </Typography>
              )}
            </Stack>
          )}
        </Box>

        {/* ── Interests ────────────────────────────────── */}
        <Box>
          <SectionLabel>Interests</SectionLabel>
          {isLoadingInterests ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={1}>
              {catalogInterests.map((interest) => {
                const isChecked = interestSelections[interest.id] || false;
                return (
                  <Chip
                    key={interest.id}
                    label={interest.name}
                    onClick={() => toggleInterest(interest.id)}
                    color={isChecked ? "primary" : "default"}
                    variant={isChecked ? "filled" : "outlined"}
                    sx={{
                      cursor: "pointer",
                      "& .MuiChip-label": { fontWeight: 500 },
                    }}
                  />
                );
              })}
              {catalogInterests.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No interests available
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* ── Availability ─────────────────────────────── */}
        <Box>
          <SectionLabel>Weekly Availability</SectionLabel>
          <AvailabilityEditor
            value={formData.availability || {}}
            onChange={(availability) =>
              setFormData({ ...formData, availability })
            }
          />
        </Box>

        {/* ── Actions ──────────────────────────────────── */}
        <Box
          display="flex"
          gap={1.5}
          justifyContent="flex-end"
          pt={1}
          borderTop="1px solid"
          sx={{ borderColor: "grey.200" }}
        >
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isSaving}
            sx={{
              borderColor: "grey.300",
              color: "text.secondary",
              "&:hover": { borderColor: "grey.500" },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving || hasAvailabilityErrors}
            sx={{
              bgcolor: "grey.900",
              "&:hover": { bgcolor: "grey.700" },
              fontWeight: 600,
            }}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </Box>
      </Stack>
    </form>
  );
}
