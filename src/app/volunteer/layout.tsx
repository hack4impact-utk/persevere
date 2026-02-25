import { redirect } from "next/navigation";
import { ReactNode } from "react";

import RoleLayout from "@/components/layout/role-layout";
import VolunteerSidebar from "@/components/layout/volunteer-sidebar";
import { getDashboardRoute } from "@/utils/routes";
import { getServerSession } from "@/utils/server/auth";

type VolunteerLayoutProps = {
  children: ReactNode;
};

/** Volunteer layout with auth + role check. */
export default async function VolunteerLayout({
  children,
}: VolunteerLayoutProps): Promise<ReactNode> {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Role check: only volunteers can access
  if (session.user.role !== "volunteer") {
    redirect(getDashboardRoute(session.user.role));
  }

  return <RoleLayout sidebar={<VolunteerSidebar />}>{children}</RoleLayout>;
}
