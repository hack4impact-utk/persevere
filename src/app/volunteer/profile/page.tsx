"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useSnackbar } from "notistack";
import { JSX, useEffect, useState } from "react";

import type { AvailabilityData } from "@/components/volunteer/availability-editor";
import ProfileEditForm from "@/components/volunteer/profile-edit-form";
import { useSignOut } from "@/hooks/use-auth";
import { useVolunteerProfile } from "@/hooks/use-volunteer-profile";

function formatTime(hhmm: string): string {
  const parts = hhmm.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    console.error("[formatTime] Invalid time string:", hhmm);
    return hhmm;
  }
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return m === 0
    ? `${hour} ${period}`
    : `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

const NOTIF_LABELS: Record<string, string> = {
  email: "Email only",
  sms: "SMS only",
  both: "Email & SMS",
  none: "None",
};

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
        borderRadius: 3,
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

/**
 * Volunteer profile page. Protected by layout auth check.
 */
export default function VolunteerProfilePage(): JSX.Element {
  const { data: session } = useSession();
  const handleSignOut = useSignOut();
  const { enqueueSnackbar } = useSnackbar();
  const {
    profile: profileData,
    isLoading: loading,
    fetchProfile,
    updateProfile,
  } = useVolunteerProfile();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

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

  if (!session) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={32} />
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

  const { users: user, volunteers: vol, totalHours } = profileData;
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const volunteerTypeDisplay = vol.volunteerType
    ? vol.volunteerType.charAt(0).toUpperCase() + vol.volunteerType.slice(1)
    : "Volunteer";

  const DAY_ORDER = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const availabilityEntries = Object.entries(vol.availability ?? {})
    .filter(([, ranges]) => Array.isArray(ranges) && ranges.length > 0)
    .sort(([a], [b]) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

  return (
    <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
      <Box sx={{ maxWidth: 860, mx: "auto", px: 3, py: 4 }}>
        {/* ── Hero header ─────────────────────────────────────── */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "grey.200",
            borderRadius: 3,
            mb: 3,
            overflow: "hidden",
          }}
        >
          {/* Accent strip */}
          <Box
            sx={{
              height: 6,
              background: "linear-gradient(90deg, #111 0%, #555 100%)",
            }}
          />

          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box
              display="flex"
              alignItems={{ xs: "flex-start", sm: "center" }}
              gap={3}
              flexDirection={{ xs: "column", sm: "row" }}
            >
              {/* Avatar */}
              <Avatar
                src={user.profilePicture || undefined}
                alt={fullName}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "grey.800",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initials(user.firstName, user.lastName)}
              </Avatar>

              {/* Name + meta */}
              <Box flex={1} minWidth={0}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  lineHeight={1.2}
                  noWrap
                >
                  {fullName || "—"}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                  <Chip
                    label={volunteerTypeDisplay}
                    size="small"
                    sx={{
                      bgcolor: "grey.900",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 22,
                    }}
                  />
                  <Chip
                    icon={
                      <AccessTimeIcon sx={{ fontSize: "0.85rem !important" }} />
                    }
                    label={`${totalHours} hrs volunteered`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22 }}
                  />
                </Box>
              </Box>

              {/* Edit button */}
              {!editMode && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                  size="small"
                  sx={{
                    borderColor: "grey.300",
                    color: "text.primary",
                    fontWeight: 600,
                    flexShrink: 0,
                    "&:hover": { borderColor: "grey.600", bgcolor: "grey.50" },
                  }}
                >
                  Edit profile
                </Button>
              )}
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
              borderRadius: 3,
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
                }}
                onSave={handleSave}
                onCancel={() => setEditMode(false)}
                loading={saving}
              />
            </CardContent>
          </Card>
        ) : (
          /* ── View mode grid ──────────────────────────────────── */
          <Grid container spacing={2.5}>
            {/* Contact */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <SectionCard
                icon={<PersonIcon sx={{ fontSize: 18 }} />}
                title="Contact"
              >
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <EmailIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.primary">
                      {user.email}
                    </Typography>
                  </Box>
                  {user.phone ? (
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <PhoneIcon
                        sx={{ fontSize: 18, color: "text.disabled" }}
                      />
                      <Typography variant="body2">{user.phone}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      No phone number added
                    </Typography>
                  )}
                </Box>
              </SectionCard>
            </Grid>

            {/* Notifications */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <SectionCard
                icon={<NotificationsIcon sx={{ fontSize: 18 }} />}
                title="Notifications"
              >
                <Chip
                  label={
                    NOTIF_LABELS[vol.notificationPreference ?? "email"] ??
                    "Email only"
                  }
                  size="small"
                  sx={{
                    bgcolor: "grey.100",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                  }}
                />
              </SectionCard>
            </Grid>

            {/* Bio — full width if present */}
            {user.bio && (
              <Grid size={12}>
                <SectionCard
                  icon={<PersonIcon sx={{ fontSize: 18 }} />}
                  title="About Me"
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.75 }}
                  >
                    {user.bio}
                  </Typography>
                </SectionCard>
              </Grid>
            )}

            {/* Availability */}
            <Grid size={12}>
              <SectionCard
                icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
                title="Weekly Availability"
              >
                {availabilityEntries.length === 0 ? (
                  <Typography variant="body2" color="text.disabled">
                    No availability set — click &quot;Edit profile&quot; to add
                    your schedule.
                  </Typography>
                ) : (
                  <Box>
                    {availabilityEntries.map(([day, ranges], index) => (
                      <Box
                        key={day}
                        display="flex"
                        alignItems="center"
                        gap={2.5}
                        py={1.25}
                        sx={
                          index < availabilityEntries.length - 1
                            ? {
                                borderBottom: "1px solid",
                                borderColor: "grey.100",
                              }
                            : {}
                        }
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          letterSpacing={0.8}
                          sx={{
                            textTransform: "uppercase",
                            color: "text.secondary",
                            minWidth: 32,
                            flexShrink: 0,
                          }}
                        >
                          {day.slice(0, 3)}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1.5}>
                          {ranges.map((r, i) => (
                            <Typography
                              key={i}
                              variant="body2"
                              fontWeight={500}
                              color="text.primary"
                            >
                              {formatTime(r.start)} – {formatTime(r.end)}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </SectionCard>
            </Grid>
          </Grid>
        )}

        {/* ── Sign out ─────────────────────────────────────────── */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button
            size="small"
            startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
            onClick={handleSignOut}
            sx={{
              color: "text.disabled",
              fontWeight: 500,
              fontSize: "0.8rem",
              "&:hover": { color: "error.main", bgcolor: "transparent" },
            }}
          >
            Sign out
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
