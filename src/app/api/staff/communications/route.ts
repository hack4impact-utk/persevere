import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  createCommunication,
  listCommunications,
} from "@/services/communications.service";
import handleError from "@/utils/handle-error";

const createCommunicationSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  recipientType: z.enum(["volunteers", "staff", "both"]),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.user.role || !["staff", "admin"].includes(session.user.role)) {
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
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.user.role || !["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await request.json();
    const result = createCommunicationSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const { recipientType } = result.data;

    if (session.user.role === "staff" && recipientType !== "volunteers") {
      return NextResponse.json(
        { message: "Staff can only send communications to volunteers" },
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
        { message: "Sender user not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(output, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Sender user not found") {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
