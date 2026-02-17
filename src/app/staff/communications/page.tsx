import { type JSX } from "react";

import { getServerSession } from "@/utils/server/auth";

import CommunicationsPageWrapper from "./communications-page-wrapper";

/** Messaging and communications management. */
export default async function StaffCommunicationsPage(): Promise<JSX.Element> {
  const session = await getServerSession();
  const userRole = (session?.user.role as "staff" | "admin") ?? "staff";

  return <CommunicationsPageWrapper userRole={userRole} />;
}
