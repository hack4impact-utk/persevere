import { DrizzleQueryError } from "drizzle-orm";

// Define an enum for common PostgreSQL error codes
export enum PostgresErrorCode {
  UniqueViolation = "23505",
  NotNullViolation = "23502",
  // Add other relevant codes as needed
}

export default function handleError(error: unknown): string {
  if (error instanceof DrizzleQueryError) {
    const cause = error.cause as { code?: string };
    if (cause?.code === PostgresErrorCode.UniqueViolation) {
      return "A record with this value already exists. Please use a unique value.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred";
}
