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
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Volunteer Profile: {profile.volunteer.users.firstName}{" "}
          {profile.volunteer.users.lastName}
        </h1>
      </div>
      <VolunteerProfile volunteer={volunteer} />
    </div>
  );
}
