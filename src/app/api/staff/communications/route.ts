import { after, NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { recipientTypeSchema } from "@/lib/status-enums";
import {
  createCommunication,
  listCommunications,
} from "@/services/communications.service";
import { requireStaffAuth } from "@/utils/server/auth";
import { sendBulkEmail } from "@/utils/server/email";
import {
  handleRouteError,
  parseBodyOrError,
} from "@/utils/server/route-helpers";

const createCommunicationSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  recipientType: recipientTypeSchema,
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

    // Schedule email dispatch after the response is sent so the client
    // isn't blocked by SMTP round-trips.
    if (output.recipientEmails.length > 0) {
      after(async () => {
        try {
          const result = await sendBulkEmail(
            output.recipientEmails,
            parsed.data.subject,
            parsed.data.body,
          );
          if (result.failures.length > 0) {
            console.error("Some emails failed to send:", result.failures);
          }
        } catch (error) {
          console.error("Failed to send bulk emails:", error);
        }
      });
    }

    return NextResponse.json(
      {
        communication: output.communication,
        emailSent: output.recipientEmails.length > 0,
        recipientCount: output.recipientEmails.length,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
