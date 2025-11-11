import { ReactNode } from "react";

import AdminSidebar from "@/components/layout/admin-sidebar";
import RoleLayout from "@/components/layout/role-layout";

type AdminLayoutProps = {
  children: ReactNode;
};

/**
 * Admin Layout
 *
 * Applies admin sidebar and shared header to all routes under /admin/*.
 * Admin sidebar extends staff navigation with admin-specific routes.
 */
export default function AdminLayout({ children }: AdminLayoutProps): ReactNode {
  return <RoleLayout sidebar={<AdminSidebar />}>{children}</RoleLayout>;
}
