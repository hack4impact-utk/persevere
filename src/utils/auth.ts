/**
 * Auth Utilities
 *
 * Server-side authentication helpers. Use these in API routes and server components.
 */
import type { Session } from "next-auth";
import { getServerSession as nextAuthGetServerSession } from "next-auth";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";

/**
 * Gets the current server session. Returns null if not authenticated.
 */
export async function getServerSession(): Promise<{
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isEmailVerified: boolean;
  };
} | null> {
  return await nextAuthGetServerSession(authOptions);
}

/**
 * Requires authentication and optionally a specific role. Throws if not met.
 * @throws {Error} "Unauthorized" if not authenticated
 * @throws {Error} "Forbidden" if role doesn't match
 */
export async function requireAuth(
  role?: "mentor" | "guest_speaker" | "flexible" | "staff" | "admin",
): Promise<Session> {
  const session = await getServerSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (role && session.user.role !== role) {
    throw new Error("Forbidden");
  }

  return session as Session;
}
