import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

import RoleLayout from "@/components/layout/role-layout";
import VolunteerSidebar from "@/components/layout/volunteer-sidebar";
import { getOnboardingStatus } from "@/services/onboarding.service";
import { getDashboardRoute } from "@/utils/routes";
import { getServerSession } from "@/utils/server/auth";

type VolunteerLayoutProps = {
  children: ReactNode;
};

/** Volunteer layout with auth + role check + onboarding redirect. */
export default async function VolunteerLayout({
  children,
}: VolunteerLayoutProps): Promise<ReactNode> {
  let session;
  try {
    session = await getServerSession();
  } catch {
    redirect("/auth/login");
  }

  if (!session) {
    redirect("/auth/login");
  }

  // Role check: only volunteers can access
  if (session.user.role !== "volunteer") {
    redirect(getDashboardRoute(session.user.role));
  }

  // Onboarding redirect: send incomplete volunteers to onboarding page
  const volunteerId = session.user.volunteerId;
  if (volunteerId) {
    const headersList = await headers();
    const pathname =
      headersList.get("x-invoke-path") ??
      headersList.get("x-nextjs-page") ??
      "";
    const isOnboardingPage = pathname.startsWith("/volunteer/onboarding");

    if (!isOnboardingPage) {
      try {
        const status = await getOnboardingStatus(volunteerId);
        if (status && !status.onboardingComplete) {
          redirect("/volunteer/onboarding");
        }
      } catch {
        // If onboarding check fails, don't block access
      }
    }
  }

  return <RoleLayout sidebar={<VolunteerSidebar />}>{children}</RoleLayout>;
}
