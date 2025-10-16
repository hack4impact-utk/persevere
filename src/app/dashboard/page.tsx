import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { JSX } from "react";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Redirect to role-specific dashboard
  switch (session.user.role) {
    case "admin": {
      redirect("/admin/dashboard");
      break;
    }
    case "staff": {
      redirect("/staff/dashboard");
      break;
    }
    case "volunteer": {
      redirect("/volunteer/dashboard");
      break;
    }
    default: {
      redirect("/auth/login");
      break;
    }
  }
}
