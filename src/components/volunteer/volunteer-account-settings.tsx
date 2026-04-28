"use client";

import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { signOut } from "next-auth/react";
import { useSnackbar } from "notistack";
import { JSX, useState } from "react";

import { ChangePasswordSection, ConfirmDialog } from "@/components/shared";
import { useVolunteerProfile } from "@/hooks/use-volunteer-profile";
import { apiClient } from "@/lib/api-client";

type SettingsSection = {
  icon: JSX.Element;
  title: string;
  children: React.ReactNode;
};

function SettingsCard({ icon, title, children }: SettingsSection): JSX.Element {
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

type Props = {
  initialFirstName: string;
  initialLastName: string;
  initialEmail: string;
  initialPhone: string;
  initialNotificationPreference: "email" | "sms" | "both" | "none";
};

export default function VolunteerAccountSettings({
  initialFirstName,
  initialLastName,
  initialEmail,
  initialPhone,
  initialNotificationPreference,
}: Props): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const { updateProfile, fetchProfile } = useVolunteerProfile();

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [notifEnabled, setNotifEnabled] = useState(
    initialNotificationPreference !== "none",
  );
  const [saving, setSaving] = useState(false);
  const [pendingEmailSave, setPendingEmailSave] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isDirty =
    firstName !== initialFirstName ||
    lastName !== initialLastName ||
    email !== initialEmail ||
    phone !== initialPhone ||
    notifEnabled !== (initialNotificationPreference !== "none");

  const handleSave = async (): Promise<void> => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      enqueueSnackbar("First name, last name, and email are required", {
        variant: "warning",
      });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        notificationPreference: notifEnabled ? "email" : "none",
      });
      await fetchProfile();
      enqueueSnackbar("Settings saved", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to save settings",
        { variant: "error" },
      );
    } finally {
      setSaving(false);
      setPendingEmailSave(false);
    }
  };

  const handleSaveClick = (): void => {
    if (email.trim() === initialEmail) {
      void handleSave();
    } else {
      setPendingEmailSave(true);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setDeleting(true);
    try {
      await apiClient.delete("/api/volunteer/profile");
      void signOut({ callbackUrl: "/auth/login" });
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to delete account",
        { variant: "error" },
      );
      setDeleting(false);
      setPendingDelete(false);
    }
  };

  return (
    <>
      <Stack spacing={3}>
        {/* Name */}
        <SettingsCard icon={<PersonIcon fontSize="small" />} title="Name">
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              size="small"
              disabled={saving}
              fullWidth
            />
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              size="small"
              disabled={saving}
              fullWidth
            />
          </Box>
        </SettingsCard>

        {/* Email & Phone */}
        <SettingsCard icon={<EmailIcon fontSize="small" />} title="Contact">
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
              disabled={saving}
              fullWidth
            />
            <TextField
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              size="small"
              disabled={saving}
              fullWidth
            />
          </Stack>
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard
          icon={<NotificationsIcon fontSize="small" />}
          title="Notifications"
        >
          <FormControlLabel
            control={
              <Switch
                checked={notifEnabled}
                onChange={(e) => setNotifEnabled(e.target.checked)}
                disabled={saving}
              />
            }
            label="Email notifications"
          />
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={0.5}
          >
            Receive email reminders for upcoming volunteer sessions and new
            announcements.
          </Typography>
        </SettingsCard>

        {/* Save button */}
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={handleSaveClick}
            disabled={saving || !isDirty}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </Box>

        <Divider />

        {/* Password */}
        <SettingsCard icon={<LockIcon fontSize="small" />} title="Password">
          <ChangePasswordSection role="volunteer" />
        </SettingsCard>

        <Divider />

        {/* Delete account */}
        <SettingsCard
          icon={<WarningAmberIcon fontSize="small" />}
          title="Delete Account"
        >
          <Typography variant="body2" color="text.secondary" mb={2}>
            Deleting your account will sign you out immediately. Your volunteer
            history — hours logged and sessions attended — will be retained for
            our records.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => setPendingDelete(true)}
          >
            Delete account
          </Button>
        </SettingsCard>
      </Stack>

      {/* Email change confirmation */}
      <ConfirmDialog
        open={pendingEmailSave}
        title="Change login email?"
        message={
          <>
            Your login email will change to <strong>{email.trim()}</strong>.
            You&apos;ll need to use this address next time you sign in. Make
            sure it&apos;s correct before saving.
          </>
        }
        confirmLabel="Yes, save changes"
        loading={saving}
        onConfirm={() => {
          void handleSave();
        }}
        onClose={() => setPendingEmailSave(false)}
      />

      {/* Delete account confirmation */}
      <ConfirmDialog
        open={pendingDelete}
        title="Delete your account?"
        message="You'll be signed out immediately. Your volunteer history (hours logged, sessions attended) will be retained for our records."
        confirmLabel="Delete account"
        confirmColor="error"
        loading={deleting}
        onConfirm={() => {
          void handleDelete();
        }}
        onClose={() => setPendingDelete(false)}
      />
    </>
  );
}
