/* eslint-disable simple-import-sort/imports */
"use client";

import NotificationsIcon from "@mui/icons-material/Notifications";
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { Session } from "next-auth";
import Link from "next/link";
import React from "react";

type StaffHeaderProps = {
  StaffHeaderTitle: string;
  StaffHeaderSession: Session;
};

const StaffHeader: React.FC<StaffHeaderProps> = ({
  StaffHeaderTitle,
  StaffHeaderSession,
}) => {
  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        {/* Title. IDK if we really need this */}
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 500 }}
        >
          {StaffHeaderTitle}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Notification bell */}
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>

          {/* Profile: if session defined, links to profile page. Else clicking profile does nothing */}
          {/* Probably want to redirect to like another page for signing up if session does not exist */}
          {StaffHeaderSession?.user ? (
            <IconButton component={Link} href="/staff/profile">
              <Avatar
                alt={StaffHeaderSession.user.name}
                src={StaffHeaderSession.user.image || undefined}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          ) : (
            <IconButton disabled>
              <Avatar alt="User" sx={{ width: 32, height: 32 }} />
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default StaffHeader;
