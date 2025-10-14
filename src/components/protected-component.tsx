"use client";
import { useSession } from "next-auth/react";

export default function ProtectedComponent(): JSX.Element {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (status === "unauthenticated") return <p>Please log in</p>;

  return <p>Welcome, {session?.user?.email}!</p>;
}
