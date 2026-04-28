"use client";

import { Box, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { type JSX } from "react";

import EmailTemplatesSettingsClient from "@/app/staff/settings/email-templates/email-templates-settings-client";
import EventCategoriesSettingsClient from "@/app/staff/settings/event-categories/event-categories-settings-client";
import SkillsSettingsClient from "@/app/staff/settings/skills/skills-settings-client";
import VolunteerTypesSettingsClient from "@/app/staff/settings/volunteer-types/volunteer-types-settings-client";
import { StaffAccountSettings } from "@/components/staff/profile/staff-account-settings";
import { StaffProfileEdit } from "@/components/staff/profile/staff-profile-edit";

const VALID_TABS = [
  "profile",
  "settings",
  "skills",
  "event-categories",
  "volunteer-types",
  "email-templates",
] as const;
type TabValue = (typeof VALID_TABS)[number];

const ACCOUNT_ITEMS = [
  { label: "Profile", value: "profile" as TabValue },
  { label: "Settings", value: "settings" as TabValue },
] as const;

const ADMIN_NAV_ITEMS = [
  { label: "Skills & Interests", value: "skills" as TabValue },
  { label: "Event Categories", value: "event-categories" as TabValue },
  { label: "Volunteer Types", value: "volunteer-types" as TabValue },
  { label: "Email Templates", value: "email-templates" as TabValue },
] as const;

export default function StaffProfilePage(): JSX.Element {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab");
  const activeTab: TabValue = (VALID_TABS as readonly string[]).includes(
    tab ?? "",
  )
    ? (tab as TabValue)
    : "profile";
  const isAdmin = session?.user?.role === "admin";

  const handleNavClick = (value: TabValue): void => {
    if (value === "profile") {
      router.push("/staff/profile");
    } else {
      router.push(`/staff/profile?tab=${value}`);
    }
  };

  return (
    <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
      {/* ── Left nav ──────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          width: 200,
          flexShrink: 0,
          borderRight: "1px solid",
          borderColor: "divider",
          overflowY: "auto",
          py: 3,
          px: 2,
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              display: "block",
              color: "text.secondary",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              mb: 1.5,
            }}
          >
            My Account
          </Typography>
        </Box>

        {ACCOUNT_ITEMS.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <Box
              key={item.value}
              onClick={() => handleNavClick(item.value)}
              sx={{
                px: 1.5,
                py: 1,
                mb: 0.5,
                borderRadius: 1.5,
                cursor: "pointer",
                backgroundColor: isActive ? "primary.main" : "transparent",
                "&:hover": {
                  backgroundColor: isActive ? "primary.main" : "action.hover",
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
          );
        })}

        {isAdmin && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                display: "block",
                color: "text.secondary",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 1.5,
              }}
            >
              Admin Settings
            </Typography>
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.value;
              return (
                <Box
                  key={item.value}
                  onClick={() => handleNavClick(item.value)}
                  sx={{
                    px: 1.5,
                    py: 1,
                    mb: 0.5,
                    borderRadius: 1.5,
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
              );
            })}
          </Box>
        )}
      </Box>

      {/* ── Content ───────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <Box sx={{ px: 3, pt: 3, pb: 4 }}>
          {activeTab === "settings" ? (
            <StaffAccountSettings />
          ) : activeTab === "skills" && isAdmin ? (
            <SkillsSettingsClient />
          ) : activeTab === "event-categories" && isAdmin ? (
            <EventCategoriesSettingsClient />
          ) : activeTab === "volunteer-types" && isAdmin ? (
            <VolunteerTypesSettingsClient />
          ) : activeTab === "email-templates" && isAdmin ? (
            <EmailTemplatesSettingsClient />
          ) : (
            <StaffProfileEdit />
          )}
        </Box>
      </Box>
    </Box>
  );
}
