"use client";

import { Box } from "@mui/material";
import { type ReactElement } from "react";

import CommunicationsList from "@/components/staff/communications/communications-list";

type CommunicationsPageWrapperProps = {
  userRole: "staff" | "admin";
};

/**
 * CommunicationsPageWrapper
 *
 * Client component wrapper for the communications page.
 */
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
        pt: 1,
        px: 2,
        pb: 2,
      }}
    >
      <CommunicationsList userRole={userRole} />
    </Box>
  );
}
