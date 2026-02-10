import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import SettingsNav from "@/components/layout/settings-nav";
import { getServerSession } from "@/utils/auth";

type SettingsLayoutProps = {
  children: ReactNode;
};

/** Settings layout — admin only. Provides settings sidebar nav. */
export default async function SettingsLayout({
  children,
}: SettingsLayoutProps): Promise<ReactNode> {
  let session;
  try {
    session = await getServerSession();
  } catch (error) {
    console.error("SettingsLayout: failed to retrieve session:", error);
    redirect("/staff/dashboard");
  }

  if (!session || session.user.role !== "admin") {
    redirect("/staff/dashboard");
  }

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      <SettingsNav />
    </div>
  );
}
