import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createTemplate,
  listTemplates,
} from "@/services/email-templates.service";
import { requireAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";

const templateCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  type: z.string().min(1, "Type is required"),
  category: z.string().optional().nullable(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const templates = await listTemplates();

    return NextResponse.json({ data: templates });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await parseBodyOrError(request, templateCreateSchema);
    if ("response" in parsed) return parsed.response;

    const newTemplate = await createTemplate(parsed.data);

    return NextResponse.json(
      { message: "Template created successfully", data: newTemplate },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
