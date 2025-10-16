import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { StaffDashboardContent } from "@/components";

export default async function StaffDashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || !["staff", "admin"].includes(session.user.role)) {
    redirect("/auth/login");
  }

  return <StaffDashboardContent />;
}
