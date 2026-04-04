"use client";

import { Box } from "@mui/material";
import { JSX } from "react";

import { StaffProfileEdit } from "@/components/staff/profile/staff-profile-edit";

/**
 * Admin profile page — accessible at /staff/settings/profile.
 * Protected by the settings layout (admin-only).
 */
export default function AdminSettingsProfilePage(): JSX.Element {
  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 1, md: 1.5 }, pb: 4 }}>
        <StaffProfileEdit />
      </Box>
    </Box>
  );
}
