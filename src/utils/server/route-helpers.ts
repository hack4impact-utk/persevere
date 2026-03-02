/**
 * Route Handler Helpers
 *
 * Shared utilities for API route handlers.
 */
import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

/**
 * Parses and validates a JSON request body against a Zod schema.
 * Returns { data } on success or { response } (a 400 NextResponse) on failure.
 *
 * Usage:
 *   const parsed = await parseBodyOrError(request, schema);
 *   if ("response" in parsed) return parsed.response;
 *   const { data } = parsed;
 */
export async function parseBodyOrError<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  const json: unknown = await request.json();
  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      response: NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      ),
    };
  }
  return { data: result.data };
}
