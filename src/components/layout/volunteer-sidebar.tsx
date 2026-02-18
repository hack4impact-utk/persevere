"use client";
import React, { JSX } from "react";

import BaseSidebar, { type NavItem } from "./base-sidebar";

/**
 * Volunteer navigation items
 *
 * Navigation for volunteer portal. Profile access is via header icon.
 */
const volunteerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/volunteer/dashboard" },
  { label: "Opportunities", href: "/volunteer/opportunities" },
  { label: "Onboarding", href: "/volunteer/onboarding" },
  { label: "Hours", href: "/volunteer/hours" },
];

/**
 * VolunteerSidebar
 *
 * Sidebar navigation for volunteer portal routes. Profile is accessible
 * via the header profile icon.
 */
export default function VolunteerSidebar(): JSX.Element {
  return <BaseSidebar navItems={volunteerNavItems} />;
}
