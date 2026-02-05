import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { hashPassword } from "@/utils/password";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { token, newPassword } = await request.json();

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

    // Find valid (non-expired) token
    const tokenRecord = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          gt(verificationTokens.expires, new Date()),
        ),
      )
      .limit(1);

    if (tokenRecord.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    const { identifier } = tokenRecord[0];

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user's password
    const updatedUser = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.email, identifier))
      .returning({ id: users.id });

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Delete the used token
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token),
        ),
      );

    return NextResponse.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
