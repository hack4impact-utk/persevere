import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ReactNode } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import RoleLayout from "@/components/layout/role-layout";
import VolunteerSidebar from "@/components/layout/volunteer-sidebar";
import { getDashboardRoute } from "@/utils/routes";

type VolunteerLayoutProps = {
  children: ReactNode;
};

/** Volunteer layout with auth + role check. */
export default async function VolunteerLayout({
  children,
}: VolunteerLayoutProps): Promise<ReactNode> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Role check: only volunteers can access
  if (session.user.role !== "volunteer") {
    redirect(getDashboardRoute(session.user.role));
  }

  return <RoleLayout sidebar={<VolunteerSidebar />}>{children}</RoleLayout>;
}
