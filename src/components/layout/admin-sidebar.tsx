"use client";
import React, { JSX } from "react";

import BaseSidebar, { type NavItem } from "./base-sidebar";

/**
 * Admin navigation items
 *
 * Admin has access to all staff routes plus admin-specific routes.
 * Profile access is via header icon, not sidebar.
 */
const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Calendar", href: "/staff/calendar" },
  { label: "Communications", href: "/staff/communications" },
  { label: "Volunteers", href: "/staff/volunteers" },
  { label: "Onboarding", href: "/staff/onboarding" },
  { label: "Analytics", href: "/staff/analytics" },
];

/**
 * AdminSidebar
 *
 * Sidebar navigation for admin routes. Extends staff navigation with
 * admin-specific dashboard. Profile is accessible via the header profile icon.
 */
export default function AdminSidebar(): JSX.Element {
  return <BaseSidebar title="Admin" navItems={adminNavItems} />;
}
