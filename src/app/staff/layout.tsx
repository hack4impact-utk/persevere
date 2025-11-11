import { ReactNode } from "react";

import RoleLayout from "@/components/layout/role-layout";
import StaffSidebar from "@/components/layout/staff-sidebar";

type StaffLayoutProps = {
  children: ReactNode;
};

/**
 * Staff Layout
 *
 * Applies staff sidebar and shared header to all routes under /staff/*.
 */
export default function StaffLayout({ children }: StaffLayoutProps): ReactNode {
  return <RoleLayout sidebar={<StaffSidebar />}>{children}</RoleLayout>;
}
