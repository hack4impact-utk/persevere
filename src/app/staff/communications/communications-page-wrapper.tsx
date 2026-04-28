"use client";

import { Box } from "@mui/material";
import { type ReactElement } from "react";

import { PageHeader } from "@/components/shared";
import CommunicationsList from "@/components/staff/communications/communications-list";

type CommunicationsPageWrapperProps = {
  userRole: "staff" | "admin";
};

export default function CommunicationsPageWrapper({
  userRole,
}: CommunicationsPageWrapperProps): ReactElement {
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        pt: { xs: 1, md: 1.5 },
        px: { xs: 2, md: 4 },
        pb: { xs: 2, md: 4 },
      }}
    >
      <PageHeader
        eyebrow={userRole === "admin" ? "Admin Portal" : "Staff Portal"}
        title="Communication"
      />
      <CommunicationsList userRole={userRole} />
    </Box>
  );
}
