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

export const env = {
  databaseUrl: getEnvVar("DATABASE_URL"),
  nextAuthSecret: getEnvVar("NEXTAUTH_SECRET"),
  nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
} as const;
