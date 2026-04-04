import { eq } from "drizzle-orm";

import db from "@/db";
import { users } from "@/db/schema";
import { NotFoundError, ValidationError } from "@/utils/errors";
import { hashPassword, verifyPassword } from "@/utils/server/password";

export async function changeUserPassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { password: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) {
    throw new ValidationError("Current password is incorrect");
  }

  const hashedPassword = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId));
}
