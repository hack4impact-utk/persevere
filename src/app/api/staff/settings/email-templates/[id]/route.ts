import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteTemplate,
  updateTemplate,
} from "@/services/email-templates.service";
import { requireAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";
import { validateAndParseId } from "@/utils/validate-id";

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
    const templateId = validateAndParseId(id);

    if (templateId === null) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 },
      );
    }

    const parsed = await parseBodyOrError(request, templateUpdateSchema);
    if ("response" in parsed) return parsed.response;

    const updated = await updateTemplate(templateId, parsed.data);

    return NextResponse.json({
      message: "Template updated successfully",
      data: updated,
    });
  } catch (error) {
    return handleRouteError(error);
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
    const templateId = validateAndParseId(id);

    if (templateId === null) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 },
      );
    }

    await deleteTemplate(templateId);

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    return handleRouteError(error);
  }
}
