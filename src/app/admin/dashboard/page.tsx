import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { AdminDashboardContent } from "@/components";

export default async function AdminDashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    redirect("/auth/login");
  }

  return <AdminDashboardContent />;
}
