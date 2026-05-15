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
  gmailUser: getEnvVar("GMAIL_USER"),
  gmailAppPassword: getEnvVar("GMAIL_APP_PASSWORD"),
  cronSecret: getEnvVar("CRON_SECRET"),
  appTimezone: process.env.APP_TIMEZONE ?? "America/Chicago",
  isProduction: process.env.NODE_ENV === "production",
} as const;
