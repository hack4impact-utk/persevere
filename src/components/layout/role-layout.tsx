"use client";

import { Box } from "@mui/material";
import {
  cloneElement,
  isValidElement,
  type JSX,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";

import MobileTopBar from "./mobile-top-bar";

type RoleLayoutProps = {
  /**
   * The portal sidebar (StaffSidebar or VolunteerSidebar). On mobile,
   * RoleLayout injects `mobileOpen` and `onMobileClose` so the sidebar
   * renders inside a temporary Drawer.
   */
  sidebar: ReactElement<{
    mobileOpen?: boolean;
    onMobileClose?: () => void;
  }>;
  children: ReactNode;
};

/**
 * RoleLayout
 *
 * Shared shell combining a sidebar and main content area. Used by the staff,
 * admin, and volunteer route trees. On viewports below the md breakpoint the
 * sidebar collapses into a drawer opened by the MobileTopBar's hamburger; on
 * larger viewports the sidebar remains permanent on the left.
 */
export default function RoleLayout({
  sidebar,
  children,
}: RoleLayoutProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWithDrawerProps = isValidElement(sidebar)
    ? cloneElement(sidebar, {
        mobileOpen,
        onMobileClose: () => setMobileOpen(false),
      })
    : sidebar;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <MobileTopBar onOpenNav={() => setMobileOpen(true)} />

      {sidebarWithDrawerProps}

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
    </Box>
  );
}
