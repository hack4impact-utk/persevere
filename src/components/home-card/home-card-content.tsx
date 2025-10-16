import { Button, Typography } from "@mui/material";
import { Session } from "next-auth";
import { ReactNode } from "react";

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
    // Redirect to dashboard if user has session
    globalThis.location.href = "/dashboard";
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
