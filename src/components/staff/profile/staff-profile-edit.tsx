"use client";

import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { type JSX, useState } from "react";

import { ChangePasswordSection, DetailField } from "@/components/shared";
import { StatusBadge } from "@/components/ui/status-badge";
import { useStaffSelfProfile } from "@/hooks/use-staff-self-profile";

function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

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

function FormSectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}): JSX.Element {
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

type FormData = {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
};

function LoadingSkeleton(): JSX.Element {
  return (
    <>
      {/* Hero skeleton */}
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
          <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width={80} height={24} />
        </CardContent>
      </Card>

      {/* Details skeleton */}
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
            <Skeleton variant="text" width={140} height={18} />
          </Box>
          <Stack spacing={2}>
            {[180, 160, 220, 140, 100, 260].map((w, i) => (
              <Box key={i}>
                <Skeleton variant="text" width={80} height={14} />
                <Skeleton variant="text" width={w} height={20} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}

export function StaffProfileEdit(): JSX.Element {
  const { profile, loading, isMutating, error, loadProfile, updateProfile } =
    useStaffSelfProfile();
  const { enqueueSnackbar } = useSnackbar();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const handleEdit = (): void => {
    if (!profile) return;
    setFormData({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
    });
    setFormErrors({});
    setEditMode(true);
  };

  const handleCancel = (): void => {
    setFormErrors({});
    setEditMode(false);
  };

  const validate = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (formData.phone.trim() && !/^[+\d\s()-]+$/.test(formData.phone.trim())) {
      errors.phone = "Invalid phone number format";
    }
    return errors;
  };

  const handleSave = async (): Promise<void> => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const success = await updateProfile({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim() || null,
      bio: formData.bio.trim() || null,
    });

    if (success) {
      enqueueSnackbar("Profile updated successfully", { variant: "success" });
      setEditMode(false);
    } else {
      enqueueSnackbar("Failed to update profile", { variant: "error" });
    }
  };

  const handleFieldChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  if (loading || (!profile && !error)) {
    return <LoadingSkeleton />;
  }

  if (error && !profile) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            void loadProfile();
          }}
        >
          Try again
        </Button>
      </Box>
    );
  }

  if (!profile) return <></>;

  const fullName =
    `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  const roleLabel = profile.role === "admin" ? "Admin" : "Staff";

  return (
    <>
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
              onClick={handleEdit}
            >
              Edit profile
            </Button>
          )}
        </Box>

        <CardContent sx={{ pt: 0, px: { xs: 2.5, md: 3.5 }, pb: 3 }}>
          <Box sx={{ mt: -6, mb: 1.5 }}>
            <Avatar
              src={profile.profilePicture ?? undefined}
              sx={{
                width: 96,
                height: 96,
                bgcolor: "primary.dark",
                fontSize: "2rem",
                fontWeight: 700,
                border: "4px solid white",
              }}
            >
              {initials(profile.firstName, profile.lastName)}
            </Avatar>
          </Box>
          <Typography variant="h5" fontWeight={700} mb={1}>
            {fullName || "—"}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <StatusBadge
              label={roleLabel}
              color="primary"
              size="small"
              variant="filled"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* ── Edit mode ───────────────────────────────────────── */}
      {editMode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <Stack spacing={4}>
            <Grid container spacing={3} alignItems="flex-start">
              <Grid size={{ xs: 12, md: 5 }}>
                <FormSectionCard
                  icon={<PersonIcon fontSize="small" />}
                  title="Profile Details"
                >
                  <SectionLabel>Contact</SectionLabel>
                  <Stack spacing={2.5}>
                    <TextField
                      label="First Name"
                      size="small"
                      value={formData.firstName}
                      onChange={handleFieldChange("firstName")}
                      error={!!formErrors.firstName}
                      helperText={formErrors.firstName}
                      fullWidth
                    />
                    <TextField
                      label="Last Name"
                      size="small"
                      value={formData.lastName}
                      onChange={handleFieldChange("lastName")}
                      error={!!formErrors.lastName}
                      helperText={formErrors.lastName}
                      fullWidth
                    />
                    <TextField
                      label="Email"
                      size="small"
                      value={profile.email}
                      disabled
                      helperText="Email cannot be changed"
                      fullWidth
                    />
                    <TextField
                      label="Phone"
                      size="small"
                      value={formData.phone}
                      onChange={handleFieldChange("phone")}
                      error={!!formErrors.phone}
                      helperText={formErrors.phone}
                      placeholder="e.g. (555) 123-4567"
                      fullWidth
                    />
                  </Stack>
                </FormSectionCard>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <FormSectionCard
                  icon={<PersonIcon fontSize="small" />}
                  title="About Me"
                >
                  <SectionLabel>Bio</SectionLabel>
                  <TextField
                    label="Bio"
                    size="small"
                    value={formData.bio}
                    onChange={handleFieldChange("bio")}
                    multiline
                    rows={6}
                    placeholder="Tell us about yourself..."
                    fullWidth
                  />
                </FormSectionCard>
              </Grid>
            </Grid>

            {/* ── Change Password ──────────────────────────── */}
            <FormSectionCard
              icon={<LockIcon fontSize="small" />}
              title="Change Password"
            >
              <ChangePasswordSection role="staff" disabled={isMutating} />
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
                onClick={handleCancel}
                disabled={isMutating}
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
                disabled={isMutating}
                sx={{
                  bgcolor: "grey.900",
                  "&:hover": { bgcolor: "grey.700" },
                  fontWeight: 600,
                }}
              >
                {isMutating ? "Saving..." : "Save changes"}
              </Button>
            </Box>
          </Stack>
        </form>
      ) : (
        /* ── View mode ──────────────────────────────────────── */
        <Grid container spacing={3}>
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
                      <DetailField label="Email" value={profile.email} />
                      <DetailField label="Phone" value={profile.phone || "—"} />
                    </Stack>
                  </SidebarCard>
                  <SidebarCard title="Role">
                    <StatusBadge
                      label={roleLabel}
                      color="primary"
                      size="small"
                      variant="filled"
                    />
                  </SidebarCard>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <FormSectionCard
              icon={<PersonIcon fontSize="small" />}
              title="About Me"
            >
              <Typography
                variant="body2"
                color={profile.bio ? "text.secondary" : "text.disabled"}
                sx={{ lineHeight: 1.75 }}
              >
                {profile.bio ?? "No bio yet."}
              </Typography>
            </FormSectionCard>
          </Grid>
        </Grid>
      )}
    </>
  );
}
