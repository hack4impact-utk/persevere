"use client";

import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import { useSnackbar } from "notistack";
import { type JSX, useState } from "react";

import { useChangePassword } from "@/hooks/use-change-password";

type ChangePasswordSectionProps = {
  role: "volunteer" | "staff";
  disabled?: boolean;
};

export function ChangePasswordSection({
  role,
  disabled,
}: ChangePasswordSectionProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const {
    isMutating: isChangingPassword,
    error: passwordApiError,
    changePassword,
  } = useChangePassword(role);

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
    const success = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
    if (success) {
      handleCancelPassword();
      enqueueSnackbar("Password changed successfully", { variant: "success" });
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
  };

  if (showPasswordSection) {
    return (
      <Stack spacing={2}>
        {passwordApiError && (
          <Alert severity="error" variant="outlined">
            {passwordApiError}
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
          disabled={isChangingPassword || !!disabled}
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
          disabled={isChangingPassword || !!disabled}
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
          disabled={isChangingPassword || !!disabled}
        />
        <Box display="flex" gap={1.5} justifyContent="flex-end">
          <Button
            variant="outlined"
            size="small"
            onClick={handleCancelPassword}
            disabled={isChangingPassword || !!disabled}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              void handleChangePassword();
            }}
            disabled={isChangingPassword || !!disabled}
          >
            {isChangingPassword ? "Changing..." : "Change password"}
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Button
      variant="outlined"
      size="small"
      onClick={() => setShowPasswordSection(true)}
      disabled={disabled}
    >
      Change password
    </Button>
  );
}
