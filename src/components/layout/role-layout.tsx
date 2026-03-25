"use client";

import { Box } from "@mui/material";
import { ReactNode } from "react";

type RoleLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

/**
 * RoleLayout
 *
 * Shared layout wrapper combining a sidebar and main content area. Used by all
 * role-specific layouts (staff, admin, volunteer). The sidebar handles its own
 * session/profile state; this wrapper is a pure structural shell.
 *
 * Note: overflow is "hidden" so each page controls its own scrolling behavior.
 */
export default function RoleLayout({
  sidebar,
  children,
}: RoleLayoutProps): ReactNode {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {sidebar}

      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          minWidth: 0,
        }}
      >
        {children}
      </Box>
    </div>
  );
}
