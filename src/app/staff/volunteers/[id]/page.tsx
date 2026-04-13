import { Box } from "@mui/material";
import { notFound } from "next/navigation";
import { JSX } from "react";

import VolunteerProfile from "@/components/staff/volunteer-management/volunteer-profile";
import { getVolunteerProfile } from "@/services/volunteer.service";
import { validateAndParseId } from "@/utils/validate-id";

/** Individual volunteer profile page. */
export default async function VolunteerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  const volunteerId = validateAndParseId(id);
  if (volunteerId === null) {
    notFound();
  }

  const profile = await getVolunteerProfile(volunteerId);

  if (!profile || !profile.volunteer.users) {
    notFound();
  }

  const volunteer = {
    volunteers: profile.volunteer.volunteers,
    users: profile.volunteer.users,
    totalHours: profile.totalHours,
    skills: profile.skills.filter(
      (
        s,
      ): s is typeof s & {
        proficiencyLevel: "beginner" | "intermediate" | "advanced";
      } => s.proficiencyLevel !== null,
    ),
    interests: profile.interests,
    recentOpportunities: profile.recentOpportunities.filter(
      (
        o,
      ): o is typeof o & {
        rsvpStatus:
          | "pending"
          | "confirmed"
          | "declined"
          | "attended"
          | "no_show";
      } => o.rsvpStatus !== null,
    ),
    hoursBreakdown: profile.hoursBreakdown,
    onboardingStatus: profile.onboardingStatus,
  };

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <VolunteerProfile volunteer={volunteer} />
    </Box>
  );
}
