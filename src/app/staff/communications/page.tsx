import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { type JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

import CommunicationsPageWrapper from "./communications-page-wrapper";

/**
 * Staff Communications Page
 *
 * Communications management page for staff to handle messaging and communications.
 * This route is protected by middleware.
 */
export default async function StaffCommunicationsPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session || !["staff", "admin"].includes(session.user.role)) {
    redirect("/auth/login");
  }

  const userRole = session.user.role as "staff" | "admin";

  return <CommunicationsPageWrapper userRole={userRole} />;
}
