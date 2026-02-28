import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { AuthenticationError, AuthorizationError } from "@/lib/api-client";

/**
 * Returns a memoized error handler for API errors in hooks.
 *
 * - AuthenticationError (401) → redirects to /auth/login.
 * - AuthorizationError (403)  → calls setError("Access denied").
 * - Generic error             → calls console.error + setError(fallbackMessage)
 *                               only when fallbackMessage is provided.
 *
 * Returns true if the error was handled (auth or forbidden), false otherwise.
 * Use the return value to early-exit catch blocks:
 *   if (handleApiError(error_, "Failed to load X.")) return;
 */
export function useApiErrorHandler(
  setError: (message: string) => void,
): (error: unknown, fallbackMessage?: string) => boolean {
  const router = useRouter();
  return useCallback(
    (error: unknown, fallbackMessage?: string): boolean => {
      if (error instanceof AuthenticationError) {
        router.push("/auth/login");
        return true;
      }
      if (error instanceof AuthorizationError) {
        setError("Access denied");
        return true;
      }
      if (fallbackMessage !== undefined) {
        console.error(error);
        setError(fallbackMessage);
      }
      return false;
    },
    [router, setError],
  );
}
