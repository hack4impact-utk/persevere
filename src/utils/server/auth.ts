/**
 * Auth Utilities
 *
 * Server-side authentication helpers. Use these in API routes and server components.
 */
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { getServerSession as nextAuthGetServerSession } from "next-auth";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import type { UserRole } from "@/types/next-auth";

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
  role?: Extract<UserRole, "volunteer" | "admin">,
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

/** Staff and admin role union — admin is a superset of staff. */
export type StaffRole = "staff" | "admin";

/**
 * Requires authentication and staff or admin role.
 * Use instead of requireAuth() + inline ["staff","admin"] check on staff-facing routes.
 * @throws {AuthError} code "Unauthorized" if not authenticated
 * @throws {AuthError} code "Forbidden" if role is not staff or admin
 */
export async function requireStaffAuth(): Promise<Session> {
  const session = await requireAuth();
  if (!["staff", "admin"].includes(session.user.role)) {
    throw new AuthError("Forbidden");
  }
  return session;
}

/**
 * Converts an AuthError into the appropriate NextResponse (401 or 403).
 * Use in catch blocks: if (error instanceof AuthError) return authErrorResponse(error);
 */
export function authErrorResponse(error: AuthError): NextResponse {
  return NextResponse.json(
    { error: error.code },
    { status: error.code === "Unauthorized" ? 401 : 403 },
  );
}
