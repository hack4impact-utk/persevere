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
import Link from "next/link";
import { useSession } from "next-auth/react";
import React from "react";

const StaffHeader: React.FC = () => {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: "auto" }}>
          {/* Notification bell */}
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>

          {/* Profile: if session defined, links to profile page. Else clicking profile does nothing */}
          {/* Probably want to redirect to like another page for signing up if session does not exist */}
          {session?.user ? (
            <IconButton component={Link} href="/staff/profile">
              <Avatar
                alt={session.user.name}
                src={session.user.image || undefined}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          ) : (
            <IconButton disabled>
              <Avatar sx={{ width: 32, height: 32 }}>
                <PersonIcon fontSize="small" />
              </Avatar>
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default StaffHeader;
