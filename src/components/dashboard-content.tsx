"use client";

import { Avatar, Box, Button, Typography } from "@mui/material";
import { signOut, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";

const handleSignOut = (): void => {
  void signOut();
};

export default function DashboardContent(): ReactNode {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.expires) {
      const expirationDate = new Date(session.expires);
      // eslint-disable-next-line no-console
      console.log(
        "Session expires at:",
        expirationDate.toLocaleString("en-US", {
          timeZone: "America/New_York",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    }
  }, [session?.expires]);

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
        Dashboard
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
          Role: {session.user?.role}
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
