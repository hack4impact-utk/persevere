"use client";
import { JSX } from "react";

import { useSignOut } from "@/utils/auth-hooks";

/**
 * Button component that signs out the current user and redirects to login.
 * For custom UI, use the useSignOut hook directly with MUI Button.
 */
export default function SignOutButton(): JSX.Element {
  const handleSignOut = useSignOut();

  return (
    <button
      onClick={handleSignOut}
      style={{
        padding: "10px",
        backgroundColor: "#ff0000",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      Sign Out
    </button>
  );
}
