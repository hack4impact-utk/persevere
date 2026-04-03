import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import db from "@/db";
import { users } from "@/db/schema";
import { ValidationError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";
import { hashPassword, verifyPassword } from "@/utils/server/password";
import { parseBodyOrError } from "@/utils/server/route-helpers";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
  })
  .strict();

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth("volunteer");
    const userId = Number.parseInt(session.user.id, 10);

    const parsed = await parseBodyOrError(request, changePasswordSchema);
    if ("response" in parsed) return parsed.response;

    const { currentPassword, newPassword } = parsed.data;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      throw new ValidationError("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof ValidationError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
