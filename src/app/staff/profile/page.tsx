"use client";

import { Avatar, Box, Button, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { JSX } from "react";

import { useSignOut } from "@/hooks/use-auth";

/**
 * Staff profile page. Protected by layout auth check.
 */
export default function StaffProfilePage(): JSX.Element {
  const { data: session } = useSession();
  const handleSignOut = useSignOut();

  // Layout handles auth redirect - this is just for loading state
  if (!session) {
    return (
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          pt: { xs: 1, md: 1.5 },
          textAlign: "center",
        }}
      >
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        pt: { xs: 1, md: 1.5 },
        px: { xs: 2, md: 4 },
        pb: 4,
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Avatar
          src={session.user?.image || undefined}
          alt={session.user?.name || "User"}
          sx={{
            width: 100,
            height: 100,
            mx: "auto",
            mb: 2,
            border: 3,
            borderColor: "primary.main",
          }}
        />
        <Typography variant="h5" gutterBottom>
          Welcome, {session.user?.name}!
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {session.user?.email}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Role: {session.user?.role}{" "}
          {session.user?.role === "admin"
            ? "(Administrator)"
            : "(Staff Member)"}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Email Verified: {session.user?.isEmailVerified ? "Yes" : "No"}
        </Typography>
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="contained"
          color="error"
          size="large"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );
}
