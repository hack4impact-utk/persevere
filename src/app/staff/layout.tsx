import { redirect } from "next/navigation";
import { ReactNode } from "react";

import RoleLayout from "@/components/layout/role-layout";
import StaffSidebar from "@/components/layout/staff-sidebar";
import { getDashboardRoute } from "@/utils/routes";
import { getServerSession } from "@/utils/server/auth";

type StaffLayoutProps = {
  children: ReactNode;
};

/** Staff layout with auth + role check. */
export default async function StaffLayout({
  children,
}: StaffLayoutProps): Promise<ReactNode> {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Role check: only staff and admin can access
  if (!["staff", "admin"].includes(session.user.role)) {
    redirect(getDashboardRoute(session.user.role));
  }

  return <RoleLayout sidebar={<StaffSidebar />}>{children}</RoleLayout>;
}
