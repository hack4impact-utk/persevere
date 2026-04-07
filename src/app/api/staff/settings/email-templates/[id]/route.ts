import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteTemplate,
  updateTemplate,
} from "@/services/email-templates.service";
import { ConflictError, NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, authErrorResponse, requireAuth } from "@/utils/server/auth";
import { parseBodyOrError } from "@/utils/server/route-helpers";

const templateUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  subject: z.string().min(1, "Subject is required").optional(),
  body: z.string().min(1, "Body is required").optional(),
  type: z.string().min(1, "Type is required").optional(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const templateId = Number.parseInt(id, 10);

    if (Number.isNaN(templateId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const parsed = await parseBodyOrError(request, templateUpdateSchema);
    if ("response" in parsed) return parsed.response;

    const updated = await updateTemplate(templateId, parsed.data);

    return NextResponse.json({
      message: "Template updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const templateId = Number.parseInt(id, 10);

    if (Number.isNaN(templateId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await deleteTemplate(templateId);

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
