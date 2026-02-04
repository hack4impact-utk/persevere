import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ReactNode } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import RoleLayout from "@/components/layout/role-layout";
import VolunteerSidebar from "@/components/layout/volunteer-sidebar";

type VolunteerLayoutProps = {
  children: ReactNode;
};

/**
 * Volunteer Layout
 *
 * Applies volunteer sidebar and shared header to all routes under /volunteer/*.
 * Redirects to login if unauthenticated.
 */
export default async function VolunteerLayout({
  children,
}: VolunteerLayoutProps): Promise<ReactNode> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return <RoleLayout sidebar={<VolunteerSidebar />}>{children}</RoleLayout>;
}
