"use client";

import { Avatar, Box, Button, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { JSX } from "react";

import { useSignOut } from "@/utils/auth-hooks";

/**
 * Admin profile page. Protected by middleware.
 */
export default function AdminProfilePage(): JSX.Element {
  const { data: session } = useSession();
  const handleSignOut = useSignOut();

  if (!session) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: "20px", maxWidth: 600, margin: "0 auto" }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

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
          Role: {session.user?.role} (Administrator)
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
