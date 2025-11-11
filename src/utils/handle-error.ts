/**
 * Error Handling Utilities
 *
 * Converts various error types into user-friendly error messages.
 */
import { DrizzleQueryError } from "drizzle-orm";

/**
 * PostgreSQL error codes for common database constraint violations.
 */
export enum PostgresErrorCode {
  UniqueViolation = "23505",
  NotNullViolation = "23502",
}

/**
 * Converts an unknown error into a user-friendly error message.
 * Handles Drizzle ORM errors, standard Errors, and unknown types.
 */
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
