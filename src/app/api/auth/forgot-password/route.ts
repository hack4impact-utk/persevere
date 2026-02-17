import { NextResponse } from "next/server";

import { initiatePasswordReset } from "@/services/auth-tokens.service";
import handleError from "@/utils/handle-error";
import { sendPasswordResetEmail } from "@/utils/server/email";

const SUCCESS_MESSAGE =
  "If an account with that email exists, a password reset link has been sent.";

// TODO: Add rate limiting to prevent abuse
export async function POST(request: Request): Promise<NextResponse> {
  let email: unknown;
  try {
    ({ email } = await request.json());

    if (!email || typeof email !== "string") {
      // Always return success to prevent email enumeration
      return NextResponse.json({ message: SUCCESS_MESSAGE });
    }

    const result = await initiatePasswordReset(email);

    if (result) {
      try {
        await sendPasswordResetEmail(email.toLowerCase().trim(), result.token);
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
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE });
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
