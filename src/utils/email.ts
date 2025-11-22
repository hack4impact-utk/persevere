import { Resend } from "resend";

// Initialize Resend client (only if API key is configured)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Sends a welcome email to a new volunteer with their login credentials
 * @param email - Volunteer's email address
 * @param firstName - Volunteer's first name
 * @param password - Generated password for the volunteer
 * @returns Promise that resolves with Resend response if email is sent successfully
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  password: string,
): Promise<unknown> {
  if (!resend || !process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const signInUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/login`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Persevere</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0;">
    <h1 style="color: #1976d2; margin-top: 0;">Welcome to Persevere, ${firstName}!</h1>
    
    <p>We're excited to have you join our volunteer community. Your account has been created and you can now sign in to get started.</p>
    
    <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h2 style="margin-top: 0; color: #333; font-size: 18px;">Your Login Credentials</h2>
      <p style="margin: 10px 0;"><strong>Username (Email):</strong> ${email}</p>
      <p style="margin: 10px 0;"><strong>Password:</strong> <code style="background-color: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${signInUrl}" style="display: inline-block; background-color: #1976d2; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Sign In to Your Account</a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      <strong>Important:</strong> Please change your password after your first login for security purposes.
    </p>
    
    <p style="color: #666; font-size: 14px;">
      If you have any questions or need assistance, please don't hesitate to reach out to our support team.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; margin: 0;">
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;

  const emailText = `
Welcome to Persevere, ${firstName}!

We're excited to have you join our volunteer community. Your account has been created and you can now sign in to get started.

Your Login Credentials:
Username (Email): ${email}
Password: ${password}

Sign in to your account: ${signInUrl}

Important: Please change your password after your first login for security purposes.

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

This is an automated message. Please do not reply to this email.
  `;

  // For development: use "onboarding@resend.dev" (Resend's test domain)
  // For production: use a verified custom domain (e.g., "noreply@yourdomain.com")
  // You must verify your domain in Resend dashboard before using it in production
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const result = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: "Welcome to Persevere - Your Account is Ready!",
    html: emailHtml,
    text: emailText,
  });

  // Resend returns errors in the response object, not as exceptions
  if (result.error) {
    const errorMessage = result.error.message || JSON.stringify(result.error);
    console.error("Resend API error:", result.error);
    throw new Error(`Failed to send email: ${errorMessage}`);
  }

  return result;
}
