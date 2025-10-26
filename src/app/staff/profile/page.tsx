import { Typography } from "@mui/material";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

export default async function StaffDashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || !["staff", "admin"].includes(session.user.role)) {
    redirect("/auth/login");
  }

  return (
    <Typography variant="h4" gutterBottom>
      PROFILE PAGE!!!!!!!!!!!!
    </Typography>
  );
}
