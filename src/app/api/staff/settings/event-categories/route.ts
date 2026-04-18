import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createEventCategory,
  listAllEventCategories,
} from "@/services/event-categories.service";
import { ConflictError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";

const eventCategoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await listAllEventCategories();

    return NextResponse.json({ data: categories });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await parseBodyOrError(request, eventCategoryCreateSchema);
    if ("response" in parsed) return parsed.response;

    const newCategory = await createEventCategory(parsed.data);

    return NextResponse.json(
      { message: "Event category created successfully", data: newCategory },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
