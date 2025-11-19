/**
 * Auth Hooks
 *
 * Client-side authentication hooks for use in client components.
 */

import { signOut } from "next-auth/react";
import { useCallback } from "react";

/**
 * Returns a memoized sign out handler that redirects to /auth/login.
 *
 * @example
 * ```tsx
 * const handleSignOut = useSignOut();
 * <Button onClick={handleSignOut}>Sign Out</Button>
 * ```
 */
export function useSignOut(): () => void {
  return useCallback(() => {
    void signOut({ callbackUrl: "/auth/login" });
  }, []);
}
