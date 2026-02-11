"use client";

import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { JSX, useState } from "react";

import AvailabilityEditor from "./availability-editor";

type ProfileData = {
  phone?: string | null;
  bio?: string | null;
  availability?: Record<string, string[] | boolean | number | string> | null;
  notificationPreference?: "email" | "sms" | "both" | "none" | null;
};

type ProfileEditFormProps = {
  initialData: ProfileData;
  onSave: (data: ProfileData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
};

/**
 * ProfileEditForm
 *
 * Self-service form for volunteers to edit their own profile.
 * Restricted to: phone, bio, availability, notification preference.
 */
export default function ProfileEditForm({
  initialData,
  onSave,
  onCancel,
  loading = false,
}: ProfileEditFormProps): JSX.Element {
  const [formData, setFormData] = useState<ProfileData>({
    phone: initialData.phone || "",
    bio: initialData.bio || "",
    availability: initialData.availability || {},
    notificationPreference: initialData.notificationPreference || "email",
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {/* Phone */}
        <TextField
          label="Phone Number"
          value={formData.phone || ""}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          fullWidth
          placeholder="(555) 123-4567"
          disabled={loading}
        />

        {/* Bio */}
        <TextField
          label="Bio"
          value={formData.bio || ""}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          fullWidth
          multiline
          rows={4}
          placeholder="Tell us about yourself..."
          disabled={loading}
        />

        {/* Availability */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Availability
          </Typography>
          <AvailabilityEditor
            value={formData.availability || {}}
            onChange={(availability) =>
              setFormData({ ...formData, availability })
            }
          />
        </Box>

        {/* Notification Preference */}
        <FormControl fullWidth disabled={loading}>
          <Typography variant="subtitle1" gutterBottom>
            Notification Preference
          </Typography>
          <Select
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
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="sms">SMS</MenuItem>
            <MenuItem value="both">Both Email & SMS</MenuItem>
            <MenuItem value="none">None</MenuItem>
          </Select>
        </FormControl>

        {/* Action Buttons */}
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
            size="large"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            size="large"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Stack>
    </form>
  );
}
