import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { VolunteerDashboardContent } from "@/components";

export default async function VolunteerDashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "volunteer") {
    redirect("/auth/login");
  }

  return <VolunteerDashboardContent />;
}
