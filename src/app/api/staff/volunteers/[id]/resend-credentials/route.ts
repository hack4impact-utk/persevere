import { NextResponse } from "next/server";

import { resetVolunteerCredentials } from "@/services/volunteer.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import {
  AuthError,
  authErrorResponse,
  requireStaffAuth,
} from "@/utils/server/auth";
import { sendWelcomeEmail } from "@/utils/server/email";
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
    await requireStaffAuth();

    const { id } = await params;
    const volunteerId = validateAndParseId(id);

    if (volunteerId === null) {
      return NextResponse.json(
        { error: "Invalid volunteer ID" },
        { status: 400 },
      );
    }

    const { email, firstName, plainPassword } =
      await resetVolunteerCredentials(volunteerId);

    // Send welcome email with new credentials
    try {
      await sendWelcomeEmail(email, firstName, plainPassword);
    } catch (emailError) {
      // Log the error but still return success since password was updated
      console.error(
        `Failed to send credentials email to ${email}:`,
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
        volunteerId,
        email,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
