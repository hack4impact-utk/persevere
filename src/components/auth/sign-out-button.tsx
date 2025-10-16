"use client";
import { signOut } from "next-auth/react";
import { JSX } from "react";

const handleSignOut = (): void => {
  void signOut({ callbackUrl: "/auth/login" });
};

export default function SignOutButton(): JSX.Element {
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
