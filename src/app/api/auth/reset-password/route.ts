import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { users, verificationTokens } from "@/db/schema";
import handleError from "@/utils/handle-error";
import { hashPassword } from "@/utils/server/password";

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

    // Delete token first to prevent reuse (atomic claim)
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
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const { identifier } = deletedTokens[0];

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user's password
    const updatedUser = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.email, identifier))
      .returning({ id: users.id });

    // User was deleted after token was created
    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
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
