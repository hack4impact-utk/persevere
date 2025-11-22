import { Typography } from "@mui/material";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

/**
 * Staff Onboarding Page
 *
 * Onboarding management page for staff to handle volunteer onboarding processes.
 * This route is protected by middleware.
 */
export default async function StaffOnboardingPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || !["staff", "admin"].includes(session.user.role)) {
    redirect("/auth/login");
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Onboarding
      </Typography>
      <Typography color="text.secondary">
        Manage volunteer onboarding processes and workflows.
      </Typography>
    </>
  );
}
