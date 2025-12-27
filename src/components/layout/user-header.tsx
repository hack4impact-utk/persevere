"use client";

import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import React from "react";

import { getProfileRoute } from "@/utils/routes";

type UserHeaderProps = {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

/**
 * UserHeader
 *
 * Shared header component displayed across all authenticated routes.
 * Accepts session and status as props to avoid calling useSession() multiple times.
 */
const UserHeader: React.FC<UserHeaderProps> = ({ session, status }) => {
  const router = useRouter();

  const getProfileLink = (): string | null => {
    if (status === "loading" || !session) return null;
    if (!session.user?.name) return "/auth/login";
    return getProfileRoute(session.user.role);
  };

  const profileLink = getProfileLink();

  const avatarElement = session?.user?.image ? (
    <Avatar
      alt={session.user?.name ?? "User"}
      src={session.user.image}
      sx={{ width: 32, height: 32 }}
    />
  ) : (
    <Avatar sx={{ width: 32, height: 32, bgcolor: "#1f2937" }}>
      <PersonIcon fontSize="small" />
    </Avatar>
  );

  const onProfileClick = (): void => {
    if (profileLink) {
      router.push(profileLink);
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        color: "#111827",
        borderBottom: "none",
        top: 0,
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          minHeight: 64,
          px: { xs: 2, sm: 3, md: 4 },
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {/* Right side: user actions */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* Optional welcome text on larger screens */}
          {session?.user?.name && (
            <Typography
              variant="body2"
              sx={{
                display: { xs: "none", sm: "block" },
                color: "#4b5563",
              }}
            >
              Hi, <strong>{session.user.name}</strong>
            </Typography>
          )}

          {/* Notifications icon */}
          <IconButton
            aria-label="notifications"
            sx={{
              color: "#4b5563",
              "&:hover": { color: "#111827" },
            }}
          >
            <NotificationsIcon />
          </IconButton>

          {/* Avatar / profile */}
          {profileLink ? (
            <IconButton
              onClick={onProfileClick}
              aria-label="profile"
              title={session?.user?.name ?? "Profile"}
              sx={{
                p: 0,
                borderRadius: "999px",
                border: "1px solid #e5e7eb",
              }}
            >
              {avatarElement}
            </IconButton>
          ) : (
            <IconButton
              disabled
              aria-label="profile"
              title="Profile (unavailable)"
              sx={{ p: 0 }}
            >
              {avatarElement}
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default UserHeader;
