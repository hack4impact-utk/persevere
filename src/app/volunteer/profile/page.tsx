"use client";

import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useState } from "react";

import ProfileEditForm from "@/components/volunteer/profile-edit-form";
import { useSignOut } from "@/utils/auth-hooks";

type VolunteerProfileData = {
  volunteers: {
    id: number;
    volunteerType?: string | null;
    notificationPreference?: "email" | "sms" | "both" | "none" | null;
    availability?: Record<string, string[] | boolean | number | string> | null;
  };
  users: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
    bio?: string | null;
    profilePicture?: string | null;
  };
  totalHours: number;
};

/**
 * Volunteer profile page. Protected by middleware.
 */
export default function VolunteerProfilePage(): JSX.Element {
  const { data: session } = useSession();
  const handleSignOut = useSignOut();
  const { enqueueSnackbar } = useSnackbar();

  const [profileData, setProfileData] = useState<VolunteerProfileData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/volunteer/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const result = await response.json();
      setProfileData(result.data);
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to load profile",
        { variant: "error" },
      );
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (data: {
    phone?: string | null;
    bio?: string | null;
    availability?: Record<string, string[] | boolean | number | string> | null;
    notificationPreference?: "email" | "sms" | "both" | "none" | null;
  }): Promise<void> => {
    setSaving(true);
    try {
      const response = await fetch("/api/volunteer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      await fetchProfile();
      setEditMode(false);
      enqueueSnackbar("Profile updated successfully", { variant: "success" });
    } catch (error) {
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
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="h6" color="error">
          Failed to load profile
        </Typography>
      </Box>
    );
  }

  const { users: user, volunteers: vol, totalHours } = profileData;
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  // Format volunteer type for display
  const volunteerType = vol.volunteerType || "volunteer";
  const volunteerTypeDisplay =
    volunteerType.charAt(0).toUpperCase() + volunteerType.slice(1);

  return (
    <Box sx={{ padding: "20px", maxWidth: 900, margin: "0 auto" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">My Profile</Typography>
        {!editMode && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </Button>
        )}
      </Box>

      {editMode ? (
        <Card>
          <CardContent>
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
        <Card>
          <CardContent>
            {/* Header Section */}
            <Box display="flex" alignItems="center" gap={3} mb={3}>
              <Avatar
                src={user.profilePicture || undefined}
                alt={fullName}
                sx={{ width: 100, height: 100 }}
              />
              <Box flex={1}>
                <Typography variant="h5" gutterBottom>
                  {fullName}
                </Typography>
                <Stack direction="row" spacing={1} mb={1}>
                  <Chip
                    label={`${volunteerTypeDisplay} Volunteer`}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`${totalHours} hours`}
                    color="success"
                    size="small"
                  />
                </Stack>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Contact Information */}
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <EmailIcon color="action" />
                <Typography variant="body1">{user.email}</Typography>
              </Box>
              {user.phone && (
                <Box display="flex" alignItems="center" gap={1}>
                  <PhoneIcon color="action" />
                  <Typography variant="body1">{user.phone}</Typography>
                </Box>
              )}
            </Stack>

            {/* Bio */}
            {user.bio && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    About Me
                  </Typography>
                  <Typography variant="body1">{user.bio}</Typography>
                </Box>
              </>
            )}

            {/* Notification Preference */}
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Notification Preference
              </Typography>
              <Chip
                label={
                  vol.notificationPreference
                    ? vol.notificationPreference.toUpperCase()
                    : "EMAIL"
                }
                size="small"
              />
            </Box>

            {/* Availability */}
            {vol.availability && Object.keys(vol.availability).length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Availability
                  </Typography>
                  <Stack spacing={1} mt={1}>
                    {Object.entries(vol.availability).map(([day, slots]) => {
                      if (Array.isArray(slots) && slots.length > 0) {
                        return (
                          <Box key={day}>
                            <Typography variant="body2" fontWeight={600}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}:
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              ml={2}
                            >
                              {slots.join(", ")}
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    })}
                  </Stack>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Button
          variant="outlined"
          color="error"
          size="large"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );
}
