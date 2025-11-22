import { Typography } from "@mui/material";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

/**
 * Volunteer Dashboard Page
 *
 * Volunteer dashboard page. Uses volunteer layout (sidebar + header) automatically.
 * This route is protected by middleware.
 */
export default async function VolunteerDashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "volunteer") {
    redirect("/auth/login");
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary">
        Overview of the whole portal.
      </Typography>
    </>
  );
}
