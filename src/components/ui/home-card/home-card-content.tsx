import { Button, Typography } from "@mui/material";
import { Session } from "next-auth";
import { ReactNode } from "react";

import { getDashboardRoute } from "@/utils/routes";

/**
 * HomeCardContent
 *
 * Landing page card component. Shows sign-in prompt for unauthenticated users
 * or redirects authenticated users directly to their role-specific dashboard.
 */
type HomeCardContentProps = {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

const handleSignIn = (): void => {
  globalThis.location.href = "/auth/login";
};

export default function HomeCardContent({
  session,
  status,
}: HomeCardContentProps): ReactNode {
  if (status === "loading") {
    return (
      <Typography variant="h6" color="text.secondary">
        Loading...
      </Typography>
    );
  }

  if (session) {
    const dashboardRoute = getDashboardRoute(session.user?.role);
    globalThis.location.href = dashboardRoute;
    return null;
  }

  return (
    <>
      <Typography variant="h5">Please Sign In</Typography>
      <Typography color="text.secondary" mb={2}>
        Sign in to access your account information
      </Typography>
      <Button variant="contained" size="large" onClick={handleSignIn}>
        Sign In
      </Button>
    </>
  );
}
