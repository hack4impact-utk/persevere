/**
 * Auth Utilities
 *
 * Server-side authentication helpers. Use these in API routes and server components.
 */
import type { Session } from "next-auth";
import { getServerSession as nextAuthGetServerSession } from "next-auth";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

export class AuthError extends Error {
  constructor(public readonly code: "Unauthorized" | "Forbidden") {
    super(code);
    this.name = "AuthError";
  }
}

/**
 * Gets the current server session. Returns null if not authenticated.
 * Catches JWT decode errors (e.g. corrupted/expired tokens) and returns null.
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    return await nextAuthGetServerSession(authOptions);
  } catch {
    return null;
  }
}

/**
 * Requires authentication and optionally a specific role. Throws if not met.
 * @throws {AuthError} code "Unauthorized" if not authenticated
 * @throws {AuthError} code "Forbidden" if role doesn't match
 */
export async function requireAuth(
  role?: "volunteer" | "admin",
): Promise<Session> {
  const session = await getServerSession();

  if (!session) {
    throw new AuthError("Unauthorized");
  }

  if (role && session.user.role !== role) {
    throw new AuthError("Forbidden");
  }

  return session;
}
