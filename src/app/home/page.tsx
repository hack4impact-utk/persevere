import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { getDashboardRoute } from "@/utils/routes";

/**
 * Home Page
 *
 * Main entry point after login. Routes users to their role-specific dashboard.
 * Protected by middleware - unauthenticated users are redirected to login.
 */
export default async function HomePage(): Promise<never> {
  const session = await getServerSession(authOptions);

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
