import { Typography } from "@mui/material";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

/**
 * Staff Communications Page
 *
 * Communications management page for staff to handle messaging and communications.
 * This route is protected by middleware.
 */
export default async function StaffCommunicationsPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || !["staff", "admin"].includes(session.user.role)) {
    redirect("/auth/login");
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Communications
      </Typography>
      <Typography color="text.secondary">
        Manage messaging and communications with volunteers and stakeholders.
      </Typography>
    </>
  );
}
