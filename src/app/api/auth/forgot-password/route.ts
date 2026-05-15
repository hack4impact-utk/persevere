import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";
import { initiatePasswordReset } from "@/services/auth-tokens.service";
import handleError from "@/utils/handle-error";
import { sendPasswordResetEmail } from "@/utils/server/email";

const SUCCESS_MESSAGE =
  "If an account with that email exists, a password reset link has been sent.";

export async function POST(request: Request): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ message: SUCCESS_MESSAGE });
  }

  let email: unknown;
  try {
    ({ email } = await request.json());

    if (!email || typeof email !== "string") {
      // Always return success to prevent email enumeration
      return NextResponse.json({ message: SUCCESS_MESSAGE });
    }
    const emailStr = email as string;
    const result = await initiatePasswordReset(emailStr);

    if (result) {
      sendPasswordResetEmail(emailStr.toLowerCase().trim(), result.token).catch(
        (error: unknown) => {
          console.error("Password reset email failed", {
            email: emailStr.toLowerCase().trim(),
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            errorType:
              error instanceof Error ? error.constructor.name : typeof error,
          });
        },
      );
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
