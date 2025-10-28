"use client";

import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import { AppBar, Avatar, Box, IconButton, Toolbar } from "@mui/material";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import React from "react";

type UserHeaderProps = {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

const getProfileRoute = (role: string | undefined): string => {
  switch (role) {
    case "admin": {
      return "/admin/profile";
    }
    case "staff": {
      return "/staff/profile";
    }
    case "volunteer": {
      return "/volunteer/profile";
    }
    default: {
      return "/dashboard";
    }
  }
};

// UserHeader takes in a session and a status object because this will be called basically everywhere.
// And we want to avoid calling useSession() twice on every single page
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
    <Avatar sx={{ width: 32, height: 32 }}>
      <PersonIcon fontSize="small" />
    </Avatar>
  );

  // we can't produce <a> so we have to use router.push
  const onProfileClick = (): void => {
    if (profileLink) {
      router.push(profileLink);
    }
  };

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: "auto" }}>
          {/* Notification bell */}
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>

          {/* Profile button. 3 cases:
           *  1. if no session at all is initialized, completely disable any navigation until session loads. Header bar still loads, but you can't sign in.
           *  2. if session is initialized but session.name does not exist, clicking profile leads to sign-in page
           *  3. if session and session.name are initialized, move to respective profile page screen
           */}
          {profileLink ? (
            <IconButton
              onClick={onProfileClick}
              color="inherit"
              aria-label="profile"
              title={session?.user?.name ?? "Profile"}
            >
              {avatarElement}
            </IconButton>
          ) : (
            <IconButton
              disabled
              aria-label="profile-disabled"
              title="Profile (unavailable)"
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
