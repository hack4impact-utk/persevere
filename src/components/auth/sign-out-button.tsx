"use client";
import { Button } from "@mui/material";
import { JSX } from "react";

import { useSignOut } from "@/hooks/use-auth";

/**
 * Button component that signs out the current user and redirects to login.
 * For custom UI, use the useSignOut hook directly with MUI Button.
 */
export default function SignOutButton(): JSX.Element {
  const handleSignOut = useSignOut();

  return (
    <Button variant="contained" color="error" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
