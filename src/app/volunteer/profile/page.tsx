"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PsychologyIcon from "@mui/icons-material/Psychology";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useSnackbar } from "notistack";
import { JSX, useEffect, useState } from "react";

import { DetailField } from "@/components/shared";
import type {
  AvailabilityData,
  Day,
} from "@/components/volunteer/availability-editor";
import ProfileEditForm from "@/components/volunteer/profile-edit-form";
import { useOnboardingDocuments } from "@/hooks/use-onboarding-documents";
import { useVolunteerProfile } from "@/hooks/use-volunteer-profile";

function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

function parseHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

type SectionCardProps = {
  icon: JSX.Element;
  title: string;
  children: React.ReactNode;
};

function SectionCard({ icon, title, children }: SectionCardProps): JSX.Element {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: 2,
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 3 }}>
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
        {children}
      </CardContent>
    </Card>
  );
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Box>
      <Typography
        variant="caption"
        fontWeight={700}
        letterSpacing={0.8}
        color="text.secondary"
        sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function AvailabilityGrid({
  availability,
}: {
  availability: AvailabilityData | null | undefined;
}): JSX.Element {
  const DAYS: Day[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const DISPLAY_START = 6;
  const DISPLAY_SPAN = 18;

  const hasAny = DAYS.some((d) => (availability?.[d]?.length ?? 0) > 0);
  if (!hasAny) {
    return (
      <Typography variant="body2" color="text.disabled">
        No availability set — click &quot;Edit profile&quot; to add your
        schedule.
      </Typography>
    );
  }

  return (
    <Box>
      <Box display="grid" sx={{ gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
        {SHORT.map((label) => (
          <Typography
            key={label}
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontSize: "0.65rem",
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
      <Box
        display="grid"
        sx={{ gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}
      >
        {DAYS.map((day) => {
          const ranges = availability?.[day] ?? [];
          return (
            <Box
              key={day}
              sx={{
                height: 120,
                bgcolor: "grey.50",
                borderRadius: 1,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {ranges.map((r, i) => {
                const sh = parseHMM(r.start);
                const eh = parseHMM(r.end);
                const top =
                  Math.max(0, (sh - DISPLAY_START) / DISPLAY_SPAN) * 100;
                const height = Math.min(
                  100 - top,
                  ((eh - sh) / DISPLAY_SPAN) * 100,
                );
                return (
                  <Box
                    key={i}
                    sx={{
                      position: "absolute",
                      top: `${top}%`,
                      height: `${height}%`,
                      left: 0,
                      right: 0,
                      bgcolor: "primary.main",
                      opacity: 0.75,
                      borderRadius: 0.5,
                    }}
                  />
                );
              })}
            </Box>
          );
        })}
      </Box>
      <Box display="flex" justifyContent="space-between" mt={0.5}>
        <Typography variant="caption" color="text.disabled" fontSize="0.6rem">
          6 AM
        </Typography>
        <Typography variant="caption" color="text.disabled" fontSize="0.6rem">
          12 PM
        </Typography>
        <Typography variant="caption" color="text.disabled" fontSize="0.6rem">
          12 AM
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Volunteer profile page. Protected by layout auth check.
 */
export default function VolunteerProfilePage(): JSX.Element {
  const { data: session } = useSession();
  const { enqueueSnackbar } = useSnackbar();
  const {
    profile: profileData,
    loading,
    fetchProfile,
    updateProfile,
  } = useVolunteerProfile();
  const { documents, signatures, fetchSignatures } = useOnboardingDocuments(
    "/api/volunteer/onboarding/documents",
  );

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    void fetchSignatures();
  }, [fetchSignatures]);

  const handleSave = async (data: {
    phone?: string | null;
    bio?: string | null;
    availability?: AvailabilityData | null;
    notificationPreference?: "email" | "sms" | "both" | "none" | null;
  }): Promise<void> => {
    setSaving(true);
    try {
      await updateProfile(data);
      await fetchProfile();
      setEditMode(false);
      enqueueSnackbar("Profile updated successfully", { variant: "success" });
    } catch (error) {
      console.error("[VolunteerProfilePage] handleSave failed:", error);
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to update profile",
        { variant: "error" },
      );
    } finally {
      setSaving(false);
    }
  };

  if (!session || loading) {
    return (
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <Box sx={{ px: 3, pt: 1, pb: 4 }}>
          {/* Hero card skeleton */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 2,
              overflow: "hidden",
              mb: 3,
            }}
          >
            <Skeleton variant="rectangular" height={120} />
            <CardContent sx={{ pt: 0, px: { xs: 2.5, md: 3.5 }, pb: 3 }}>
              <Box sx={{ mt: -6, mb: 1.5 }}>
                <Skeleton
                  variant="circular"
                  width={96}
                  height={96}
                  sx={{ border: "4px solid white" }}
                />
              </Box>
              <Skeleton
                variant="text"
                width={200}
                height={40}
                sx={{ mb: 1.5 }}
              />
              <Box display="flex" gap={1}>
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rounded" width={110} height={24} />
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rounded" width={100} height={24} />
              </Box>
            </CardContent>
          </Card>

          {/* Three-zone skeleton */}
          <Grid container spacing={3}>
            {/* Sidebar */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "grey.200",
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Skeleton
                    variant="text"
                    width="50%"
                    height={18}
                    sx={{ mb: 1.5 }}
                  />
                  <Skeleton variant="text" width="85%" height={18} />
                  <Skeleton
                    variant="text"
                    width="70%"
                    height={18}
                    sx={{ mb: 2 }}
                  />
                  <Divider sx={{ my: 2 }} />
                  <Skeleton
                    variant="text"
                    width="55%"
                    height={18}
                    sx={{ mb: 1.5 }}
                  />
                  <Skeleton variant="rounded" width={140} height={20} />
                </CardContent>
              </Card>
            </Grid>

            {/* Main section cards */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={3}>
                {/* Availability card */}
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "grey.200",
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                      <Skeleton variant="rounded" width={32} height={32} />
                      <Skeleton variant="text" width={160} height={18} />
                    </Box>
                    <Skeleton
                      variant="rectangular"
                      height={120}
                      sx={{ borderRadius: 1 }}
                    />
                  </CardContent>
                </Card>

                {/* Skills card */}
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "grey.200",
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                      <Skeleton variant="rounded" width={32} height={32} />
                      <Skeleton variant="text" width={80} height={18} />
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {[90, 110, 75, 120, 85].map((w, i) => (
                        <Skeleton
                          key={i}
                          variant="rounded"
                          width={w}
                          height={28}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Interests card */}
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "grey.200",
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                      <Skeleton variant="rounded" width={32} height={32} />
                      <Skeleton variant="text" width={90} height={18} />
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {[100, 85, 115, 95].map((w, i) => (
                        <Skeleton
                          key={i}
                          variant="rounded"
                          width={w}
                          height={28}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Could not load your profile.
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            void fetchProfile();
          }}
        >
          Try again
        </Button>
      </Box>
    );
  }

  const {
    users: user,
    volunteers: vol,
    totalHours,
    skills,
    interests,
  } = profileData;
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

  const responseMap = new Map(
    signatures.map((s) => [
      s.documentId,
      { consentGiven: s.consentGiven, signedAt: s.signedAt },
    ]),
  );
  const volunteerTypeDisplay = vol.volunteerType
    ? vol.volunteerType.charAt(0).toUpperCase() + vol.volunteerType.slice(1)
    : "Volunteer";

  return (
    <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
      <Box sx={{ px: 3, pt: 1, pb: 4 }}>
        {/* ── Hero banner ─────────────────────────────────────── */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "grey.200",
            borderRadius: 2,
            overflow: "hidden",
            mb: 3,
          }}
        >
          {/* Gradient band */}
          <Box
            sx={{
              height: 120,
              background: "linear-gradient(135deg, #327bf7 0%, #1a4db5 100%)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              p: 2,
            }}
          >
            {!editMode && (
              <Button
                variant="contained"
                size="small"
                startIcon={<EditIcon />}
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                  color: "white",
                  backdropFilter: "blur(4px)",
                }}
                onClick={() => setEditMode(true)}
              >
                Edit profile
              </Button>
            )}
          </Box>

          <CardContent sx={{ pt: 0, px: { xs: 2.5, md: 3.5 }, pb: 3 }}>
            <Box sx={{ mt: -6, mb: 1.5 }}>
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  bgcolor: "primary.dark",
                  fontSize: "2rem",
                  fontWeight: 700,
                  border: "4px solid white",
                }}
              >
                {initials(user.firstName, user.lastName)}
              </Avatar>
            </Box>
            <Typography variant="h5" fontWeight={700} mb={1.5}>
              {fullName || "—"}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Chip
                label={volunteerTypeDisplay}
                size="small"
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  fontWeight: 600,
                }}
              />
              <Chip
                icon={<AccessTimeIcon />}
                label={`${totalHours.toFixed(2)} hrs`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<PsychologyIcon />}
                label={`${skills.length} skills`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<FavoriteBorderIcon />}
                label={`${interests.length} interests`}
                size="small"
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>

        {/* ── Edit mode ───────────────────────────────────────── */}
        {editMode ? (
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Typography variant="subtitle1" fontWeight={700} mb={3}>
                Edit Profile
              </Typography>
              <ProfileEditForm
                initialData={{
                  phone: user.phone,
                  bio: user.bio,
                  availability: vol.availability,
                  notificationPreference: vol.notificationPreference,
                  skills: profileData.skills,
                  interests: profileData.interests,
                }}
                onSave={handleSave}
                onCancel={() => setEditMode(false)}
                loading={saving}
              />
            </CardContent>
          </Card>
        ) : (
          /* ── Three-zone view ─────────────────────────────────── */
          <Grid container spacing={3}>
            {/* Sidebar */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "grey.200",
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={3} divider={<Divider />}>
                    <SidebarCard title="Contact">
                      <Stack spacing={2}>
                        <DetailField label="Email" value={user.email} />
                        <DetailField label="Phone" value={user.phone ?? "—"} />
                      </Stack>
                    </SidebarCard>

                    <SidebarCard title="Notifications">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor:
                              vol.notificationPreference === "none"
                                ? "grey.400"
                                : "success.main",
                          }}
                        />
                        <Typography variant="body2">
                          {vol.notificationPreference === "none"
                            ? "Notifications off"
                            : "Email notifications on"}
                        </Typography>
                      </Box>
                    </SidebarCard>

                    <SidebarCard title="About Me">
                      <Typography
                        variant="body2"
                        color={user.bio ? "text.secondary" : "text.disabled"}
                        sx={{ lineHeight: 1.75 }}
                      >
                        {user.bio ?? "No bio yet."}
                      </Typography>
                    </SidebarCard>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Main content */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={3}>
                {/* Availability */}
                <SectionCard
                  icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
                  title="Weekly Availability"
                >
                  <AvailabilityGrid availability={vol.availability} />
                </SectionCard>

                {/* Skills */}
                <SectionCard
                  icon={<PsychologyIcon sx={{ fontSize: 18 }} />}
                  title="Skills"
                >
                  {skills.length === 0 ? (
                    <Typography variant="body2" color="text.disabled">
                      No skills added — click &quot;Edit profile&quot; to add
                      your skills.
                    </Typography>
                  ) : (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {skills.map((skill) => (
                        <Chip
                          key={skill.skillId}
                          label={skill.skillName ?? "Unknown"}
                          sx={{
                            bgcolor: "rgba(50, 123, 247, 0.08)",
                            color: "primary.dark",
                            fontWeight: 500,
                            fontSize: "0.8rem",
                            height: 28,
                            border: "1px solid rgba(50, 123, 247, 0.2)",
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </SectionCard>

                {/* Interests */}
                <SectionCard
                  icon={<FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                  title="Interests"
                >
                  {interests.length === 0 ? (
                    <Typography variant="body2" color="text.disabled">
                      No interests added — click &quot;Edit profile&quot; to add
                      your interests.
                    </Typography>
                  ) : (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {interests.map((interest) => (
                        <Chip
                          key={interest.interestId}
                          label={interest.interestName ?? "Unknown"}
                          sx={{
                            bgcolor: "rgba(50, 123, 247, 0.08)",
                            color: "primary.dark",
                            fontWeight: 500,
                            fontSize: "0.8rem",
                            height: 28,
                            border: "1px solid rgba(50, 123, 247, 0.2)",
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </SectionCard>

                {/* Documents */}
                <SectionCard
                  icon={<DescriptionIcon sx={{ fontSize: 18 }} />}
                  title="Documents"
                >
                  {documents.length === 0 ? (
                    <Typography variant="body2" color="text.disabled">
                      No onboarding documents yet.
                    </Typography>
                  ) : (
                    <Box sx={{ overflowY: "auto", maxHeight: 240 }}>
                      <Stack spacing={0}>
                        {documents.map((doc) => {
                          const response = responseMap.get(doc.id);
                          const signed = response !== undefined;
                          return (
                            <Box
                              key={doc.id}
                              display="flex"
                              alignItems="center"
                              gap={1}
                              sx={{
                                py: 1,
                                borderBottom: "1px solid",
                                borderColor: "grey.100",
                                "&:last-child": { borderBottom: "none" },
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  gap={0.75}
                                  flexWrap="wrap"
                                >
                                  <Typography
                                    variant="body2"
                                    fontWeight={500}
                                    noWrap
                                  >
                                    {doc.title}
                                  </Typography>
                                  {doc.required && (
                                    <Chip
                                      label="Required"
                                      size="small"
                                      color="error"
                                      variant="outlined"
                                      sx={{
                                        height: 18,
                                        fontSize: "0.65rem",
                                      }}
                                    />
                                  )}
                                </Box>
                                {signed && response ? (
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={0.5}
                                    mt={0.25}
                                  >
                                    <CheckCircleIcon
                                      color="success"
                                      sx={{ fontSize: 12 }}
                                    />
                                    <Typography
                                      variant="caption"
                                      color="success.main"
                                    >
                                      {doc.actionType === "consent"
                                        ? response.consentGiven
                                          ? `Consented · ${new Date(response.signedAt).toLocaleDateString()}`
                                          : `Declined · ${new Date(response.signedAt).toLocaleDateString()}`
                                        : doc.actionType === "acknowledge"
                                          ? `Acknowledged · ${new Date(response.signedAt).toLocaleDateString()}`
                                          : `Signed · ${new Date(response.signedAt).toLocaleDateString()}`}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography
                                    variant="caption"
                                    color="text.disabled"
                                  >
                                    Pending
                                  </Typography>
                                )}
                              </Box>
                              {signed ? (
                                <Chip
                                  icon={
                                    <CheckCircleIcon sx={{ fontSize: 14 }} />
                                  }
                                  label="Completed"
                                  size="small"
                                  color="success"
                                  sx={{ flexShrink: 0 }}
                                />
                              ) : (
                                <Chip
                                  label="Pending"
                                  size="small"
                                  variant="outlined"
                                  sx={{ flexShrink: 0 }}
                                />
                              )}
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </SectionCard>
              </Stack>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}
