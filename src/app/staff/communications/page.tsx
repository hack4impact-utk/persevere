import { getServerSession } from "next-auth";
import { type JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

import CommunicationsPageWrapper from "./communications-page-wrapper";

/** Messaging and communications management. */
export default async function StaffCommunicationsPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user.role as "staff" | "admin") ?? "staff";

  return <CommunicationsPageWrapper userRole={userRole} />;
}
