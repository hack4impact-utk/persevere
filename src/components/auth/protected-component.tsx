"use client";
import { useSession } from "next-auth/react";
import { JSX } from "react";

/**
 * ProtectedComponent
 *
 * Example component demonstrating session-based access control.
 * Shows different content based on authentication status.
 */
export default function ProtectedComponent(): JSX.Element {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (status === "unauthenticated") return <p>Please log in</p>;

  return <p>Welcome, {session?.user?.email}!</p>;
}
