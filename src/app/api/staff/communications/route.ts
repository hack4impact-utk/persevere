import { NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  createCommunication,
  listCommunications,
} from "@/services/communications.service";
import { NotFoundError } from "@/utils/errors";
import handleError from "@/utils/handle-error";
import { AuthError, requireAuth } from "@/utils/server/auth";

const createCommunicationSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  recipientType: z.enum(["volunteers", "staff", "both"]),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(
      searchParams.get("limit") || String(DEFAULT_PAGE_SIZE),
    );

    const result = await listCommunications({
      page,
      limit,
      search: searchParams.get("search"),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth();
    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await request.json();
    const result = createCommunicationSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const { recipientType } = result.data;

    if (session.user.role === "staff" && recipientType !== "volunteers") {
      return NextResponse.json(
        { error: "Staff can only send communications to volunteers" },
        { status: 403 },
      );
    }

    const output = await createCommunication({
      ...result.data,
      senderEmail: session.user.email ?? "",
      senderRole: session.user.role,
    });

    if (!output.communication) {
      return NextResponse.json(
        { error: "Sender user not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(output, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === "Unauthorized" ? 401 : 403 },
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
