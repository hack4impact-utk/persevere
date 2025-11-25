import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import VolunteerList from "@/components/volunteer-management/volunteer-list";

export default async function VolunteersPage(): Promise<ReactElement> {
  const session = await getServerSession(authOptions);

  if (!session || !["staff", "admin"].includes(session.user.role)) {
    redirect("/auth/login");
  }

  return <VolunteerList />;
}
