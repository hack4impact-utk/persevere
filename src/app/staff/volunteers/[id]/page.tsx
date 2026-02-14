import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { JSX } from "react";

import VolunteerProfile from "@/components/staff/volunteer-management/volunteer-profile";
import db from "@/db";
import { users, volunteers } from "@/db/schema";

/** Individual volunteer profile page. */
export default async function VolunteerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  const volunteerId = Number.parseInt(id, 10);

  if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
    notFound();
  }

  const volunteerWithUser = await db
    .select()
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.id, volunteerId))
    .then((results) => results[0]);

  if (!volunteerWithUser || !volunteerWithUser.users) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Volunteer Profile: {volunteerWithUser.users.firstName}{" "}
          {volunteerWithUser.users.lastName}
        </h1>
      </div>
      <VolunteerProfile volunteer={volunteerWithUser} />
    </div>
  );
}
