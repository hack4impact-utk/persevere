"use client";

import { Box } from "@mui/material";
import { JSX } from "react";

import { StaffProfileEdit } from "@/components/staff/profile/staff-profile-edit";

export default function StaffProfilePage(): JSX.Element {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 1, md: 1.5 }, pb: 4 }}>
      <StaffProfileEdit />
    </Box>
  );
}
