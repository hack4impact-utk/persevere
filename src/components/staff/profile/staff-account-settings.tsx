"use client";

import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { type JSX, useState } from "react";

import { ChangePasswordSection, DetailField } from "@/components/shared";
import { useStaffSelfProfile } from "@/hooks/use-staff-self-profile";

type SettingsSectionProps = {
  icon: JSX.Element;
  title: string;
  children: React.ReactNode;
};

function SettingsCard({
  icon,
  title,
  children,
}: SettingsSectionProps): JSX.Element {
  return (
    <Card
      elevation={0}
      sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}
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
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export function StaffAccountSettings(): JSX.Element {
  const { profile, loading, isMutating, updateProfile } = useStaffSelfProfile();
  const { enqueueSnackbar } = useSnackbar();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleEdit = (): void => {
    if (!profile) return;
    setFormData({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
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
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
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
    });
    if (success) {
      enqueueSnackbar("Settings saved", { variant: "success" });
      setEditMode(false);
    } else {
      enqueueSnackbar("Failed to save settings", { variant: "error" });
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

  if (loading && !profile) return <></>;

  return (
    <Stack spacing={3}>
      {/* Personal Info */}
      <SettingsCard
        icon={<PersonIcon fontSize="small" />}
        title="Personal Info"
      >
        {editMode ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
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
                value={profile?.email ?? ""}
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
              <Box display="flex" gap={1.5} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  size="small"
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
                  size="small"
                  disabled={isMutating}
                  sx={{
                    bgcolor: "grey.900",
                    "&:hover": { bgcolor: "grey.700" },
                    fontWeight: 600,
                  }}
                >
                  {isMutating ? "Saving…" : "Save"}
                </Button>
              </Box>
            </Stack>
          </form>
        ) : (
          <Stack spacing={2}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Stack spacing={2} flex={1}>
                <DetailField
                  label="Name"
                  value={
                    profile
                      ? `${profile.firstName} ${profile.lastName}`.trim()
                      : "—"
                  }
                />
                <DetailField label="Email" value={profile?.email ?? "—"} />
                <DetailField label="Phone" value={profile?.phone ?? "—"} />
              </Stack>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon fontSize="small" />}
                onClick={handleEdit}
                sx={{
                  borderColor: "grey.300",
                  color: "text.secondary",
                  "&:hover": { borderColor: "grey.500" },
                  flexShrink: 0,
                  ml: 2,
                }}
              >
                Edit
              </Button>
            </Box>
          </Stack>
        )}
      </SettingsCard>

      {/* Security */}
      <SettingsCard icon={<LockIcon fontSize="small" />} title="Security">
        <ChangePasswordSection role="staff" />
      </SettingsCard>
    </Stack>
  );
}
