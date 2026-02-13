"use client";

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { JSX, useState } from "react";

import AvailabilityEditor, {
  type AvailabilityData,
} from "./availability-editor";

type ProfileData = {
  phone?: string | null;
  bio?: string | null;
  availability?: AvailabilityData | null;
  notificationPreference?: "email" | "sms" | "both" | "none" | null;
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
      <Stack spacing={4} sx={{ maxWidth: 560, mx: "auto" }}>
        {/* ── Contact ──────────────────────────────────── */}
        <Box>
          <SectionLabel>Contact</SectionLabel>
          <TextField
            label="Phone Number"
            value={formData.phone || ""}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            fullWidth
            placeholder="(555) 123-4567"
            disabled={loading}
            size="small"
          />
        </Box>

        {/* ── About ────────────────────────────────────── */}
        <Box>
          <SectionLabel>About Me</SectionLabel>
          <TextField
            label="Bio"
            value={formData.bio || ""}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            fullWidth
            multiline
            rows={3}
            placeholder="Tell us about yourself..."
            disabled={loading}
            size="small"
          />
        </Box>

        {/* ── Notifications ────────────────────────────── */}
        <Box>
          <SectionLabel>Notifications</SectionLabel>
          <FormControl fullWidth disabled={loading} size="small">
            <InputLabel id="notification-preference-label">
              How would you like to be notified?
            </InputLabel>
            <Select
              labelId="notification-preference-label"
              label="How would you like to be notified?"
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
              <MenuItem value="email">Email only</MenuItem>
              <MenuItem value="sms">SMS only</MenuItem>
              <MenuItem value="both">Email & SMS</MenuItem>
              <MenuItem value="none">None</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* ── Availability ─────────────────────────────── */}
        <Box>
          <SectionLabel>Weekly Availability</SectionLabel>
          <AvailabilityEditor
            value={formData.availability || {}}
            onChange={(availability) =>
              setFormData({ ...formData, availability })
            }
          />
        </Box>

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
            disabled={loading}
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
            disabled={loading}
            sx={{
              bgcolor: "grey.900",
              "&:hover": { bgcolor: "grey.700" },
              fontWeight: 600,
            }}
          >
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </Box>
      </Stack>
    </form>
  );
}
