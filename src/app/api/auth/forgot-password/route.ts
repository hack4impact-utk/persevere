import crypto from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { sendPasswordResetEmail } from "@/utils/email";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email } = await request.json();

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

    // Generate token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

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
      console.error("Failed to send password reset email:", error);
      // Still return success to prevent information leakage
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
