import crypto from "node:crypto";

import { eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { sendPasswordResetEmail } from "@/utils/email";
import handleError from "@/utils/handle-error";

// Token expiration: 1 hour
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

// TODO: Add rate limiting to prevent abuse
export async function POST(request: Request): Promise<NextResponse> {
  let email: unknown;
  try {
    ({ email } = await request.json());

    if (!email || typeof email !== "string") {
      // Always return success to prevent email enumeration
      return NextResponse.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Check if user exists
    const user = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (user.length === 0) {
      // Don't reveal that the email doesn't exist
      return NextResponse.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Clean up expired tokens
    await db
      .delete(verificationTokens)
      .where(lt(verificationTokens.expires, new Date()));

    // Invalidate old tokens for this email
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email.toLowerCase().trim()));

    // Generate token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + TOKEN_EXPIRATION_MS);

    // Store token in verificationTokens
    await db.insert(verificationTokens).values({
      identifier: email.toLowerCase().trim(),
      token,
      expires,
    });

    // Send email
    try {
      await sendPasswordResetEmail(email.toLowerCase().trim(), token);
    } catch (error) {
      console.error("Password reset email failed", {
        email: email.toLowerCase().trim(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
      });
      // Still return success to prevent email enumeration
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password request failed", {
      email: typeof email === "string" ? email.toLowerCase().trim() : "unknown",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
