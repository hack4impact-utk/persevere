import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import VolunteerProfile from "@/components/volunteers/volunteer-profile";
import db from "@/db";
import { users, volunteers } from "@/db/schema";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function VolunteerDetailsPage({
  params,
}: PageProps): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  // Only staff and admin can view volunteer profiles
  if (!session || !["staff", "admin"].includes(session.user.role)) {
    redirect("/auth/login");
  }

  // Get volunteer data from the database
  const volunteerId = Number.parseInt(params.id, 10);

  if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
    notFound();
  }

  // Query volunteer data with user information using the API pattern
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
