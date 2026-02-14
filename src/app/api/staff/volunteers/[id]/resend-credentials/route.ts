import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/db";
import { users, volunteers } from "@/db/schema";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";
import { sendWelcomeEmail } from "@/utils/server/email";
import { generateSecurePassword, hashPassword } from "@/utils/server/password";
import { validateAndParseId } from "@/utils/validate-id";

/**
 * POST /api/staff/volunteers/[id]/resend-credentials
 * Resend welcome email with login credentials to a volunteer
 * Generates a new password for security and sends it via email
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Require staff or admin role
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const volunteerId = validateAndParseId(id);

    if (volunteerId === null) {
      return NextResponse.json(
        { message: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    // Find the volunteer with their user information
    const volunteerData = await db
      .select()
      .from(volunteers)
      .leftJoin(users, eq(volunteers.userId, users.id))
      .where(eq(volunteers.id, volunteerId));

    if (volunteerData.length === 0 || !volunteerData[0]?.users) {
      return NextResponse.json(
        { message: "Volunteer not found" },
        { status: 404 },
      );
    }

    const volunteer = volunteerData[0].volunteers;
    const user = volunteerData[0].users;

    // Generate a new secure password
    // This invalidates the old password, which is fine since they didn't have it
    const plainPassword = generateSecurePassword(12);
    const hashedPassword = await hashPassword(plainPassword);

    // Update the password in the database
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Send welcome email with new credentials
    try {
      await sendWelcomeEmail(user.email, user.firstName, plainPassword);
    } catch (emailError) {
      // Log the error but still return success since password was updated
      console.error(
        `Failed to send credentials email to ${user.email}:`,
        emailError,
      );
      return NextResponse.json(
        {
          message:
            "Password was reset, but failed to send email. Please try again or contact support.",
          error: "Email sending failed",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Credentials have been resent successfully",
      data: {
        volunteerId: volunteer.id,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
