"use client";
import React, { JSX } from "react";

import BaseSidebar, { NavItem } from "./base-sidebar";

/**
 * Staff navigation items
 *
 * Ordered by usage frequency. Profile access is via header icon, not sidebar.
 */
const staffNavItems: NavItem[] = [
  { label: "Dashboard", href: "/staff/dashboard" },
  { label: "Calendar", href: "/staff/calendar" },
  { label: "Communications", href: "/staff/communications" },
  { label: "Volunteers", href: "/staff/volunteers" },
  { label: "Onboarding", href: "/staff/onboarding" },
  { label: "Analytics", href: "/staff/analytics" },
];

/**
 * StaffSidebar
 *
 * Sidebar navigation for staff routes. Uses BaseSidebar with staff-specific
 * navigation items. Profile is accessible via the header profile icon.
 */
export default function StaffSidebar(): JSX.Element {
  return <BaseSidebar title="Staff" navItems={staffNavItems} />;
}
