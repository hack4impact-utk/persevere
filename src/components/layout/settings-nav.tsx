"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactElement, useState } from "react";

type SettingsSection = {
  label: string;
  href: string;
  description?: string;
  comingSoon?: boolean;
};

type SettingsGroup = {
  label: string;
  items: [SettingsSection, ...SettingsSection[]];
};

const sections: SettingsGroup[] = [
  {
    label: "Catalog",
    items: [
      {
        label: "Skills & Interests",
        href: "/staff/settings/skills",
      },
    ],
  },
  {
    label: "Users",
    items: [
      {
        label: "Staff Accounts",
        href: "/staff/settings/staff",
        comingSoon: true,
      },
      {
        label: "Volunteer Types",
        href: "/staff/settings/volunteer-types",
        comingSoon: true,
      },
    ],
  },
  {
    label: "Application",
    items: [
      {
        label: "System Settings",
        href: "/staff/settings/system",
        comingSoon: true,
      },
      {
        label: "Email Templates",
        href: "/staff/settings/email",
        comingSoon: true,
      },
    ],
  },
  {
    label: "Monitoring",
    items: [
      {
        label: "Audit Log",
        href: "/staff/settings/audit-log",
        comingSoon: true,
      },
    ],
  },
];

export default function SettingsNav(): ReactElement {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <Box
        component="nav"
        aria-label="Settings navigation"
        sx={{
          width: 48,
          flexShrink: 0,
          borderLeft: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 2,
        }}
      >
        <Tooltip title="Expand settings" placement="left">
          <IconButton size="small" onClick={() => setCollapsed(false)}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box
      component="nav"
      aria-label="Settings navigation"
      sx={{
        width: 240,
        flexShrink: 0,
        borderLeft: "1px solid",
        borderColor: "divider",
        overflowY: "auto",
        py: 3,
        px: 2,
      }}
    >
      <Box
        sx={{
          px: 1,
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: "text.secondary",
            fontWeight: 700,
            letterSpacing: "0.1em",
          }}
        >
          Settings
        </Typography>
        <Tooltip title="Collapse" placement="left">
          <IconButton size="small" onClick={() => setCollapsed(true)}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {sections.map((group, groupIndex) => (
        <Box
          key={group.label}
          sx={{ mb: groupIndex < sections.length - 1 ? 3 : 0 }}
        >
          <Typography
            variant="caption"
            sx={{
              px: 1,
              mb: 0.5,
              display: "block",
              color: "text.disabled",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {group.label}
          </Typography>

          {group.items.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            if (item.comingSoon) {
              return (
                <Box
                  key={item.href}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1,
                    py: 0.75,
                    borderRadius: 1,
                    cursor: "not-allowed",
                    opacity: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {item.label}
                  </Typography>
                  <Chip
                    label="Soon"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.65rem",
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                </Box>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: "none" }}
              >
                <Box
                  sx={{
                    px: 1,
                    py: 0.75,
                    borderRadius: 1,
                    cursor: "pointer",
                    backgroundColor: isActive ? "primary.main" : "transparent",
                    "&:hover": {
                      backgroundColor: isActive
                        ? "primary.main"
                        : "action.hover",
                    },
                    transition: "background-color 0.15s",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "primary.contrastText" : "text.primary",
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </Link>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
