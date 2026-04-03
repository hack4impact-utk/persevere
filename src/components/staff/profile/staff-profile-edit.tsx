"use client";

import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { type JSX, useState } from "react";

import { DetailField } from "@/components/shared";
import { StatusBadge } from "@/components/ui/status-badge";
import { useChangePassword } from "@/hooks/use-change-password";
import { useStaffSelfProfile } from "@/hooks/use-staff-self-profile";

function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
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

  const {
    isMutating: isChangingPassword,
    error: passwordApiError,
    changePassword,
  } = useChangePassword("staff");

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const validatePassword = (): boolean => {
    const errors: typeof passwordErrors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (passwordData.newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters";
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (): Promise<void> => {
    if (!validatePassword()) return;
    setPasswordSuccess(false);
    const success = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
    if (success) {
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      enqueueSnackbar("Password changed successfully", {
        variant: "success",
      });
    }
  };

  const handleCancelPassword = (): void => {
    setShowPasswordSection(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setPasswordSuccess(false);
  };

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
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ mt: 1, display: "block" }}
          >
            Profile picture upload coming soon
          </Typography>
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
              <TextField
                label="Bio"
                size="small"
                value={formData.bio}
                onChange={handleFieldChange("bio")}
                multiline
                rows={4}
                placeholder="Tell us about yourself..."
                fullWidth
              />
            </Stack>

            <Box display="flex" justifyContent="flex-end" gap={1.5} mt={3}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCancel}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  void handleSave();
                }}
                disabled={isMutating}
              >
                {isMutating ? "Saving..." : "Save"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        /* ── View mode ──────────────────────────────────────── */
        <SectionCard
          icon={<PersonIcon sx={{ fontSize: 18 }} />}
          title="Profile Details"
        >
          <Stack spacing={2}>
            <DetailField label="First Name" value={profile.firstName || "—"} />
            <DetailField label="Last Name" value={profile.lastName || "—"} />
            <DetailField label="Email" value={profile.email} />
            <DetailField label="Phone" value={profile.phone || "—"} />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                Role
              </Typography>
              <StatusBadge
                label={roleLabel}
                color="primary"
                size="small"
                variant="filled"
              />
            </Box>
            <DetailField
              label="Bio"
              value={profile.bio || "No bio yet."}
              valueSx={
                profile.bio
                  ? { lineHeight: 1.75 }
                  : { lineHeight: 1.75, color: "text.disabled" }
              }
            />
          </Stack>
        </SectionCard>
      )}

      {/* ── Change Password ──────────────────────────────── */}
      <Box sx={{ mt: 3 }}>
        <SectionCard
          icon={<LockIcon sx={{ fontSize: 18 }} />}
          title="Change Password"
        >
          {showPasswordSection ? (
            <Collapse in={showPasswordSection}>
              <Stack spacing={2}>
                {passwordApiError && (
                  <Alert severity="error" variant="outlined">
                    {passwordApiError}
                  </Alert>
                )}
                {passwordSuccess && (
                  <Alert severity="success" variant="outlined">
                    Password changed successfully
                  </Alert>
                )}
                <TextField
                  label="Current Password"
                  type="password"
                  size="small"
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    });
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors({
                        ...passwordErrors,
                        currentPassword: undefined,
                      });
                    }
                  }}
                  error={!!passwordErrors.currentPassword}
                  helperText={passwordErrors.currentPassword}
                  fullWidth
                  disabled={isChangingPassword}
                />
                <TextField
                  label="New Password"
                  type="password"
                  size="small"
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    });
                    if (passwordErrors.newPassword) {
                      setPasswordErrors({
                        ...passwordErrors,
                        newPassword: undefined,
                      });
                    }
                  }}
                  error={!!passwordErrors.newPassword}
                  helperText={passwordErrors.newPassword}
                  fullWidth
                  disabled={isChangingPassword}
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  size="small"
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    });
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors({
                        ...passwordErrors,
                        confirmPassword: undefined,
                      });
                    }
                  }}
                  error={!!passwordErrors.confirmPassword}
                  helperText={passwordErrors.confirmPassword}
                  fullWidth
                  disabled={isChangingPassword}
                />
                <Box display="flex" gap={1.5} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCancelPassword}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      void handleChangePassword();
                    }}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Changing..." : "Change password"}
                  </Button>
                </Box>
              </Stack>
            </Collapse>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowPasswordSection(true)}
            >
              Change password
            </Button>
          )}
        </SectionCard>
      </Box>
    </>
  );
}
