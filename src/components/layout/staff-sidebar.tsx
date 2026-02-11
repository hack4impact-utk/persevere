"use client";

import { useSession } from "next-auth/react";
import React, { JSX, useMemo } from "react";

import BaseSidebar, { NavItem } from "./base-sidebar";

//the icons for the side bar

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

const UsersIcon = (): JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="8" r="3" stroke="white" strokeWidth="2" />
    <path
      d="M3 19c0-3 2.5-5 6-5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="18" cy="9" r="2.5" stroke="white" strokeWidth="2" />
    <path
      d="M15.5 17.5c1-.8 2.1-1.2 3.5-1.2 1.4 0 2.5.4 3.5 1.2"
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

const BarChartIcon = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 20V9M10 20V4M16 20v-7M3 20h18"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ChatIcon = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 20l1.5-3H7a8 8 0 1 1 0-16h6a5 5 0 0 1 5 5v4a8 8 0 0 1-8 8H8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SettingsIcon = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function StaffSidebar(): JSX.Element {
  const { data: session } = useSession();
  const user = session?.user as { role?: string } | undefined;

  const isAdmin = user?.role === "admin";

  const navItems: NavItem[] = useMemo(() => {
    const baseItems: NavItem[] = [
      { label: "Dashboard", href: "/staff/dashboard", icon: <DashboardIcon /> },
      { label: "Calendar", href: "/staff/calendar", icon: <CalendarIcon /> },
      {
        label: "Onboarding",
        href: "/staff/onboarding",
        icon: <DocumentIcon />,
      },
      { label: "Analytics", href: "/staff/analytics", icon: <BarChartIcon /> },
      {
        label: "Communication",
        href: "/staff/communications",
        icon: <ChatIcon />,
      },
    ];

    // Admin sees "People" tab, staff sees "Volunteers" tab
    if (isAdmin) {
      baseItems.splice(2, 0, {
        label: "People",
        href: "/staff/people",
        icon: <UsersIcon />,
      });
      baseItems.push({
        label: "Settings",
        href: "/staff/settings",
        icon: <SettingsIcon />,
      });
    } else {
      baseItems.splice(2, 0, {
        label: "Volunteers",
        href: "/staff/volunteers",
        icon: <UsersIcon />,
      });
    }

    return baseItems;
  }, [isAdmin]);

  return <BaseSidebar navItems={navItems} />;
}
