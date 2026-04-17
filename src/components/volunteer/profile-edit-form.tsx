"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import PsychologyIcon from "@mui/icons-material/Psychology";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { JSX, useEffect, useState } from "react";

import { ChangePasswordSection } from "@/components/shared";
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
  proficiencyLevel:
    | "no_selection"
    | "beginner"
    | "intermediate"
    | "advanced"
    | null;
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
  employer?: string | null;
  jobTitle?: string | null;
  city?: string | null;
  state?: string | null;
  referralSource?: string | null;
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

type FormSectionCardProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  centerContent?: boolean;
};

function FormSectionCard({
  icon,
  title,
  children,
  centerContent,
}: FormSectionCardProps): JSX.Element {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: 2,
        height: "100%",
        ...(centerContent && { display: "flex", flexDirection: "column" }),
      }}
    >
      <CardContent
        sx={{
          p: 3,
          ...(centerContent && {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            "&:last-child": { pb: 3 },
          }),
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={2.5}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: "grey.100",
              color: "text.secondary",
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="caption"
            fontWeight={700}
            letterSpacing={0.8}
            color="text.secondary"
            sx={{ textTransform: "uppercase" }}
          >
            {title}
          </Typography>
        </Box>
        {centerContent ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {children}
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
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
    employer: initialData.employer || "",
    jobTitle: initialData.jobTitle || "",
    city: initialData.city || "",
    state: initialData.state || "",
    referralSource: initialData.referralSource || "",
  });

  // Local skills state: map of skillId -> checked
  const [skillSelections, setSkillSelections] = useState<
    Record<number, { checked: boolean }>
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
        selections[skill.id] = { checked: !!current };
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
        initialData.skills?.map((s) => [s.skillId, true]) || [],
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
          skillPromises.push(addSkill(skillId));
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

  const isSaving = loading || savingSkillsInterests;

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        {/* ── About Me ─────────────────────────────────── */}
        <FormSectionCard
          icon={<PersonIcon fontSize="small" />}
          title="About Me"
        >
          <TextField
            label="Bio"
            value={formData.bio || ""}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            fullWidth
            multiline
            rows={4}
            placeholder="Tell us about yourself..."
            disabled={isSaving}
            size="small"
          />
        </FormSectionCard>

        {/* ── Two-column grid ──────────────────────────── */}
        <Grid container spacing={3} alignItems="stretch">
          {/* Left: Profile Details */}
          <Grid size={{ xs: 12, md: 5 }}>
            <FormSectionCard
              icon={<PersonIcon fontSize="small" />}
              title="Profile Details"
            >
              <SectionLabel>Contact</SectionLabel>
              <Stack spacing={2}>
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
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                  <TextField
                    label="City"
                    value={formData.city || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    disabled={isSaving}
                    size="small"
                  />
                  <TextField
                    label="State"
                    value={formData.state || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    disabled={isSaving}
                    size="small"
                  />
                </Box>
                <TextField
                  label="Employer"
                  value={formData.employer || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, employer: e.target.value })
                  }
                  fullWidth
                  disabled={isSaving}
                  size="small"
                />
                <TextField
                  label="Job Title"
                  value={formData.jobTitle || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, jobTitle: e.target.value })
                  }
                  fullWidth
                  disabled={isSaving}
                  size="small"
                />
                <TextField
                  label="How did you hear about us?"
                  value={formData.referralSource || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, referralSource: e.target.value })
                  }
                  fullWidth
                  disabled={isSaving}
                  size="small"
                />
              </Stack>
            </FormSectionCard>
          </Grid>

          {/* Right: Skills + Interests + Notifications */}
          <Grid size={{ xs: 12, md: 7 }}>
            <FormSectionCard
              icon={<PsychologyIcon fontSize="small" />}
              title="Skills & Interests"
            >
              <SectionLabel>Skills</SectionLabel>
              {isLoadingSkills ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Autocomplete
                  multiple
                  options={catalogSkills}
                  getOptionLabel={(option) => option.name}
                  value={catalogSkills.filter(
                    (s) => skillSelections[s.id]?.checked,
                  )}
                  onChange={(_, newValue) => {
                    setSkillSelections((prev) => {
                      const updated = { ...prev };
                      for (const skill of catalogSkills) {
                        updated[skill.id] = {
                          checked: newValue.some((s) => s.id === skill.id),
                        };
                      }
                      return updated;
                    });
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disabled={isSaving}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search and select skills"
                      size="small"
                      placeholder={
                        catalogSkills.filter(
                          (s) => skillSelections[s.id]?.checked,
                        ).length === 0
                          ? "Type to search..."
                          : ""
                      }
                    />
                  )}
                />
              )}

              <Divider sx={{ my: 2.5 }} />

              <SectionLabel>Interests</SectionLabel>
              {isLoadingInterests ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Autocomplete
                  multiple
                  options={catalogInterests}
                  getOptionLabel={(option) => option.name}
                  value={catalogInterests.filter(
                    (i) => interestSelections[i.id],
                  )}
                  onChange={(_, newValue) => {
                    setInterestSelections(() => {
                      const updated: Record<number, boolean> = {};
                      for (const interest of catalogInterests) {
                        updated[interest.id] = newValue.some(
                          (i) => i.id === interest.id,
                        );
                      }
                      return updated;
                    });
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disabled={isSaving}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search and select interests"
                      size="small"
                      placeholder={
                        catalogInterests.filter((i) => interestSelections[i.id])
                          .length === 0
                          ? "Type to search..."
                          : ""
                      }
                    />
                  )}
                />
              )}

              <Divider sx={{ my: 2.5 }} />

              <SectionLabel>Notifications</SectionLabel>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notificationPreference !== "none"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationPreference: e.target.checked
                          ? "email"
                          : "none",
                      })
                    }
                    disabled={isSaving}
                  />
                }
                label="Email notifications"
              />
            </FormSectionCard>
          </Grid>
        </Grid>

        {/* ── Availability ─────────────────────────────── */}
        <FormSectionCard
          icon={<AccessTimeIcon fontSize="small" />}
          title="Weekly Availability"
        >
          <AvailabilityEditor
            value={formData.availability || {}}
            onChange={(availability) =>
              setFormData({ ...formData, availability })
            }
          />
        </FormSectionCard>

        {/* ── Change Password ──────────────────────────── */}
        <FormSectionCard
          icon={<LockIcon fontSize="small" />}
          title="Change Password"
        >
          <ChangePasswordSection role="volunteer" disabled={isSaving} />
        </FormSectionCard>

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
