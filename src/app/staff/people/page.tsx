import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import PeopleList from "@/components/people-management/people-list";

export default async function PeoplePage(): Promise<ReactElement> {
  const session = await getServerSession(authOptions);

  // Only admins can access the People page
  if (!session || session.user.role !== "admin") {
    redirect("/auth/login");
  }

  return <PeopleList />;
}
