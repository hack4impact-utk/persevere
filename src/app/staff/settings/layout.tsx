import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import SettingsNav from "@/components/layout/settings-nav";
import { requireAuth } from "@/utils/server/auth";

type SettingsLayoutProps = {
  children: ReactNode;
};

/** Settings layout — admin only. Provides settings sidebar nav. */
export default async function SettingsLayout({
  children,
}: SettingsLayoutProps): Promise<ReactNode> {
  try {
    await requireAuth("admin");
  } catch {
    redirect("/staff/dashboard");
  }

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      <SettingsNav />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
