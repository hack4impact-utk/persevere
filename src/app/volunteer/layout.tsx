import { ReactNode } from "react";

import RoleLayout from "@/components/layout/role-layout";
import VolunteerSidebar from "@/components/layout/volunteer-sidebar";

type VolunteerLayoutProps = {
  children: ReactNode;
};

/**
 * Volunteer Layout
 *
 * Applies volunteer sidebar and shared header to all routes under /volunteer/*.
 * Volunteer sidebar has a simplified structure compared to staff/admin.
 */
export default function VolunteerLayout({
  children,
}: VolunteerLayoutProps): ReactNode {
  return <RoleLayout sidebar={<VolunteerSidebar />}>{children}</RoleLayout>;
}
