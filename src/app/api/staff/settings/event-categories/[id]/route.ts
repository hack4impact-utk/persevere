import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteEventCategory,
  updateEventCategory,
} from "@/services/event-categories.service";
import { requireAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

const eventCategoryUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const categoryId = validateAndParseId(id);
    if (categoryId === null) {
      return NextResponse.json(
        { error: "Invalid event category ID" },
        { status: 400 },
      );
    }

    const parsed = await parseBodyOrError(request, eventCategoryUpdateSchema);
    if ("response" in parsed) return parsed.response;

    const updated = await updateEventCategory(categoryId, parsed.data);
    revalidateTag("event-categories");

    return NextResponse.json({
      message: "Event category updated successfully",
      data: updated,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const categoryId = validateAndParseId(id);
    if (categoryId === null) {
      return NextResponse.json(
        { error: "Invalid event category ID" },
        { status: 400 },
      );
    }

    await deleteEventCategory(categoryId);
    revalidateTag("event-categories");

    return NextResponse.json({
      message: "Event category deactivated successfully",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
