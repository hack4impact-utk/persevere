import { Typography } from "@mui/material";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

/**
 * Admin Dashboard Page
 *
 * Admin dashboard page. Uses admin layout (sidebar + header) automatically.
 * This route is protected by middleware.
 */
export default async function AdminDashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
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
