import { Typography } from "@mui/material";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

/**
 * Staff Analytics Page
 *
 * Analytics and reporting dashboard for staff to view insights and metrics.
 * This route is protected by middleware.
 */
export default async function StaffAnalyticsPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || !["staff", "admin"].includes(session.user.role)) {
    redirect("/auth/login");
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Typography color="text.secondary">
        View insights, metrics, and analytics for your organization.
      </Typography>
    </>
  );
}
