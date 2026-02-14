import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import PeopleList from "@/components/staff/people-management/people-list";

/** Staff/admin management (admin only). */
export default async function PeoplePage(): Promise<ReactElement> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    redirect("/staff/dashboard");
  }

  return <PeopleList />;
}
