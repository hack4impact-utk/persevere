import { redirect } from "next/navigation";
import { type ReactElement } from "react";

import PeopleList from "@/components/staff/people-management/people-list";
import { requireAuth } from "@/utils/server/auth";

/** Staff/admin management (admin only). */
export default async function PeoplePage(): Promise<ReactElement> {
  try {
    await requireAuth("admin");
  } catch {
    redirect("/staff/dashboard");
  }

  return <PeopleList />;
}
