import { NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  createCommunication,
  listCommunications,
} from "@/services/communications.service";
import { requireStaffAuth } from "@/utils/server/auth";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";

const createCommunicationSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  recipientType: z.enum(["volunteers", "staff", "both"]),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireStaffAuth();

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
    return handleRouteError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireStaffAuth();

    const parsed = await parseBodyOrError(request, createCommunicationSchema);
    if ("response" in parsed) return parsed.response;

    const { recipientType } = parsed.data;

    if (session.user.role === "staff" && recipientType !== "volunteers") {
      return NextResponse.json(
        { error: "Staff can only send communications to volunteers" },
        { status: 403 },
      );
    }

    const output = await createCommunication({
      ...parsed.data,
      senderEmail: session.user.email ?? "",
    });

    if (!output.communication) {
      return NextResponse.json(
        { error: "Sender user not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(output, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
