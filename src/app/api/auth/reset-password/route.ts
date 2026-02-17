import { NextResponse } from "next/server";

import { redeemPasswordResetToken } from "@/services/auth-tokens.service";
import handleError from "@/utils/handle-error";

export async function POST(request: Request): Promise<NextResponse> {
  let token: unknown;
  let newPassword: unknown;
  try {
    ({ token, newPassword } = await request.json());

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 },
      );
    }

    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const success = await redeemPasswordResetToken(token, newPassword);

    if (!success) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Password reset failed", {
      hasToken: !!token,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
