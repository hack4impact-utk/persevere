import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ReactNode } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import RoleLayout from "@/components/layout/role-layout";
import StaffSidebar from "@/components/layout/staff-sidebar";

type StaffLayoutProps = {
  children: ReactNode;
};

/**
 * Staff Layout
 *
 * Applies staff sidebar and shared header to all routes under /staff/*.
 * Redirects to login if unauthenticated.
 */
export default async function StaffLayout({
  children,
}: StaffLayoutProps): Promise<ReactNode> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return <RoleLayout sidebar={<StaffSidebar />}>{children}</RoleLayout>;
}
