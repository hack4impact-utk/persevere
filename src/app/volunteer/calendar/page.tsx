import { Box } from "@mui/material";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { Calendar } from "@/components/calendar";

/**
 * Volunteer Calendar Page
 *
 * Calendar view for volunteers to view events, schedules, and appointments.
 * Volunteers can only view events, not create, edit, or delete them.
 * This route is protected by middleware.
 */
export default async function VolunteerCalendarPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "volunteer") {
    redirect("/auth/login");
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Calendar readOnly />
    </Box>
  );
}
