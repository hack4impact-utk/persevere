import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import SignOutButton from "@/components/sign-out-button";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <p>Email Verified: {session.user.isEmailVerified ? "Yes" : "No"}</p>

      <SignOutButton />
    </div>
  );
}
