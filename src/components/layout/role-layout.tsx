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
 *
 * Note: overflow is set to "hidden" so each page can control its own scrolling behavior.
 */
export default function RoleLayout({
  sidebar,
  children,
}: RoleLayoutProps): ReactNode {
  const { data: session, status } = useSession();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      {sidebar}

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Header - shared across all roles */}
        <UserHeader session={session} status={status} />

        {/* Page content - each page controls its own scrolling */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            minHeight: 0,
          }}
        >
          {children}
        </Box>
      </div>
    </div>
  );
}
