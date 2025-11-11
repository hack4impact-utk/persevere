"use client";

import { Box } from "@mui/material";
import { useSession } from "next-auth/react";
import { ReactNode } from "react";

import UserHeader from "./user-header";

type RoleLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

/**
 * RoleLayout
 *
 * Shared layout wrapper that combines a sidebar and header. Used by all
 * role-specific layouts (staff, admin, volunteer) to provide consistent structure.
 */
export default function RoleLayout({
  sidebar,
  children,
}: RoleLayoutProps): ReactNode {
  const { data: session, status } = useSession();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      {sidebar}

      {/* Main content area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header - shared across all roles */}
        <UserHeader session={session} status={status} />

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, overflow: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
