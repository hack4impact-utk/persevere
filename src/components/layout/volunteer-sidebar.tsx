"use client";
import React, { JSX } from "react";

import BaseSidebar, { type NavItem } from "./base-sidebar";

const DashboardIcon = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="8"
      height="8"
      rx="1.5"
      stroke="white"
      strokeWidth="2"
    />
    <rect
      x="13"
      y="3"
      width="8"
      height="5"
      rx="1.5"
      stroke="white"
      strokeWidth="2"
    />
    <rect
      x="13"
      y="10"
      width="8"
      height="11"
      rx="1.5"
      stroke="white"
      strokeWidth="2"
    />
    <rect
      x="3"
      y="13"
      width="8"
      height="8"
      rx="1.5"
      stroke="white"
      strokeWidth="2"
    />
  </svg>
);

const CalendarIcon = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      stroke="white"
      strokeWidth="2"
    />
    <path
      d="M8 3v4M16 3v4M3 10h18"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const DocumentIcon = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 3v5h5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClockIcon = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
    <path
      d="M12 7v5l3 3"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MegaphoneIcon = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 9v6h4l5 5V4L7 9H3z"
      stroke="white"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M16 8.5a5 5 0 0 1 0 7"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Volunteer navigation items
 *
 * Navigation for volunteer portal. Profile access is via header icon.
 */
const volunteerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/volunteer/dashboard", icon: <DashboardIcon /> },
  {
    label: "Opportunities",
    href: "/volunteer/opportunities",
    icon: <CalendarIcon />,
  },
  {
    label: "Onboarding",
    href: "/volunteer/onboarding",
    icon: <DocumentIcon />,
  },
  {
    label: "Announcements",
    href: "/volunteer/announcements",
    icon: <MegaphoneIcon />,
  },
  { label: "Hours", href: "/volunteer/hours", icon: <ClockIcon /> },
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
