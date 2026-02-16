import crypto from "node:crypto";

import { and, eq, gt, lt } from "drizzle-orm";

import db from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { hashPassword } from "@/utils/server/password";

// Token expiration: 1 hour
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Initiates a password reset for the given email.
 * Returns the generated token if the user exists, or null if not found.
 * Callers should always return 200 regardless to prevent email enumeration.
 */
export async function initiatePasswordReset(
  email: string,
): Promise<{ token: string } | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  // Clean up expired tokens and old tokens for this email
  await db
    .delete(verificationTokens)
    .where(lt(verificationTokens.expires, new Date()));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, normalizedEmail));

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + TOKEN_EXPIRATION_MS);

  await db.insert(verificationTokens).values({
    identifier: normalizedEmail,
    token,
    expires,
  });

  return { token };
}

/**
 * Atomically redeems a password reset token and updates the user's password.
 * Returns true on success, false if token is invalid or expired.
 */
export async function redeemPasswordResetToken(
  token: string,
  newPassword: string,
): Promise<boolean> {
  const deletedTokens = await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date()),
      ),
    )
    .returning();

  if (deletedTokens.length === 0) {
    return false;
  }

  const { identifier } = deletedTokens[0];
  const hashedPassword = await hashPassword(newPassword);

  const updatedUser = await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.email, identifier))
    .returning({ id: users.id });

  return updatedUser.length > 0;
}
