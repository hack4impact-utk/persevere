/**
 * Environment Variables
 *
 * Centralized environment variable validation and access.
 * Throws errors at startup if required variables are missing.
 */

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getNextAuthUrl(): string {
  if (process.env.NODE_ENV === "production") {
    return getEnvVar("NEXTAUTH_URL");
  }
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export const env = {
  databaseUrl: getEnvVar("DATABASE_URL"),
  nextAuthSecret: getEnvVar("NEXTAUTH_SECRET"),
  nextAuthUrl: getNextAuthUrl(),
  resendApiKey: getEnvVar("RESEND_API_KEY"),
  resendFromEmail: getEnvVar("RESEND_FROM_EMAIL"),
  isProduction: process.env.NODE_ENV === "production",
} as const;
