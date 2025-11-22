import { Box } from "@mui/material";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { Calendar } from "@/components/calendar";

/**
 * Staff Calendar Page
 *
 * Calendar view for staff to manage events, schedules, and appointments.
 * This route is protected by middleware.
 */
export default async function StaffCalendarPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || !["staff", "admin"].includes(session.user.role)) {
    redirect("/auth/login");
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Calendar />
    </Box>
  );
}
