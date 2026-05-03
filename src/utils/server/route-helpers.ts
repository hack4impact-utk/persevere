/**
 * Route Handler Helpers
 *
 * Shared utilities for API route handlers.
 */
import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

import { ConflictError, NotFoundError, ValidationError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse } from "@/utils/server/auth";

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

/**
 * Maps typed domain errors to the correct NextResponse.
 * Use as the sole statement in catch blocks for standard route handlers.
 * Routes with custom service errors should handle those first, then call this as fallback.
 */
export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof AuthError) return authErrorResponse(error);
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: handleError(error) }, { status: 500 });
}
