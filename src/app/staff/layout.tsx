import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ReactNode } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import RoleLayout from "@/components/layout/role-layout";
import StaffSidebar from "@/components/layout/staff-sidebar";
import { getDashboardRoute } from "@/utils/routes";

type StaffLayoutProps = {
  children: ReactNode;
};

/** Staff layout with auth + role check. */
export default async function StaffLayout({
  children,
}: StaffLayoutProps): Promise<ReactNode> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Role check: only staff and admin can access
  if (!["staff", "admin"].includes(session.user.role)) {
    redirect(getDashboardRoute(session.user.role));
  }

  return <RoleLayout sidebar={<StaffSidebar />}>{children}</RoleLayout>;
}
