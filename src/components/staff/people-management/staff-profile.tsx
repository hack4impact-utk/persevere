"use client";

import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { JSX } from "react";

import { DetailField } from "@/components/shared";
import { StatusBadge } from "@/components/ui";
import type { FetchStaffByIdResult } from "@/services/staff.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── SidebarCard — matches volunteer-overview-tab.tsx ──────────────────────────

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Box>
      <Typography
        variant="caption"
        fontWeight={700}
        letterSpacing={0.8}
        color="text.secondary"
        sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

// ── StaffProfile ──────────────────────────────────────────────────────────────

type Props = {
  profile: FetchStaffByIdResult;
};

export default function StaffProfile({ profile }: Props): JSX.Element {
  const { users, staff, isAdmin } = profile;

  const fullName =
    `${users?.firstName ?? ""} ${users?.lastName ?? ""}`.trim() || "—";

  const notifText =
    staff.notificationPreference === "none"
      ? "Notifications off"
      : staff.notificationPreference === "sms"
        ? "SMS notifications on"
        : staff.notificationPreference === "both"
          ? "Email & SMS on"
          : "Email notifications on";

  return (
    <>
      {/* Hero Banner — mirrors VolunteerOverviewTab hero */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "grey.200",
          borderRadius: 2,
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box
          sx={{
            height: 120,
            background: "linear-gradient(135deg, #327bf7 0%, #1a4db5 100%)",
          }}
        />
        <CardContent sx={{ pt: 0, px: { xs: 2.5, md: 3.5 }, pb: 3 }}>
          <Box sx={{ mt: -6, mb: 1.5 }}>
            <Avatar
              src={users?.profilePicture ?? undefined}
              sx={{
                width: 96,
                height: 96,
                bgcolor: "primary.dark",
                fontSize: "2rem",
                fontWeight: 700,
                border: "4px solid white",
              }}
            >
              {!users?.profilePicture &&
                initials(users?.firstName, users?.lastName)}
            </Avatar>
          </Box>
          <Typography variant="h5" fontWeight={700} mb={1.5}>
            {fullName}
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            <Chip
              label={isAdmin ? "Admin" : "Staff"}
              size="small"
              sx={{ bgcolor: "primary.main", color: "white", fontWeight: 600 }}
            />
            <Chip
              label={users?.isActive ? "Active" : "Inactive"}
              size="small"
              color={users?.isActive ? "success" : "default"}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Info card — SidebarCard sections with dividers, matches volunteer sidebar */}
      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3} divider={<Divider />}>
            <SidebarCard title="Contact">
              <Stack spacing={2}>
                <DetailField label="Email" value={users?.email ?? "—"} />
                <DetailField label="Phone" value={users?.phone ?? "—"} />
              </Stack>
            </SidebarCard>

            <SidebarCard title="Status">
              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    Account
                  </Typography>
                  <StatusBadge
                    label={users?.isActive ? "Active" : "Inactive"}
                    color={users?.isActive ? "success" : "default"}
                    icon={<PersonIcon fontSize="small" />}
                  />
                </Box>
              </Stack>
            </SidebarCard>

            <SidebarCard title="Notifications">
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor:
                      staff.notificationPreference === "none"
                        ? "grey.400"
                        : "success.main",
                  }}
                />
                <Typography variant="body2">{notifText}</Typography>
              </Box>
            </SidebarCard>

            <SidebarCard title="Account">
              <Stack spacing={2}>
                <DetailField label="Role" value={isAdmin ? "Admin" : "Staff"} />
                <DetailField
                  label="Member since"
                  value={formatDate(staff.createdAt)}
                />
                <DetailField
                  label="Email verified"
                  value={
                    users?.emailVerifiedAt
                      ? formatDate(users.emailVerifiedAt)
                      : "Not verified"
                  }
                />
              </Stack>
            </SidebarCard>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
