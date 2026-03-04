import { redirect } from "next/navigation";

import { getDashboardRoute } from "@/utils/routes";
import { getServerSession } from "@/utils/server/auth";

/**
 * Home Page
 *
 * Main entry point after login. Routes users to their role-specific dashboard.
 * Protected by middleware - unauthenticated users are redirected to login.
 */
export default async function HomePage(): Promise<never> {
  let session;
  try {
    session = await getServerSession();
  } catch {
    redirect("/auth/login");
  }

  if (!session) {
    redirect("/auth/login");
  }

  const role = session.user.role;
  if (!role || !["admin", "staff", "volunteer"].includes(role)) {
    redirect("/auth/login");
  }

  const dashboardRoute = getDashboardRoute(role);
  redirect(dashboardRoute);
}
