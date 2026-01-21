import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import db from "@/db";
import { bulkCommunicationLogs, users } from "@/db/schema";
import handleError from "@/utils/handle-error";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only staff and admin can access communications
    if (!session.user.role || !["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const communicationId = Number.parseInt(id);

    if (Number.isNaN(communicationId)) {
      return NextResponse.json(
        { message: "Invalid communication ID" },
        { status: 400 },
      );
    }

    // Fetch communication with sender info
    const communication = await db
      .select({
        id: bulkCommunicationLogs.id,
        senderId: bulkCommunicationLogs.senderId,
        subject: bulkCommunicationLogs.subject,
        body: bulkCommunicationLogs.body,
        recipientType: bulkCommunicationLogs.recipientType,
        sentAt: bulkCommunicationLogs.sentAt,
        status: bulkCommunicationLogs.status,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(bulkCommunicationLogs)
      .leftJoin(users, eq(bulkCommunicationLogs.senderId, users.id))
      .where(eq(bulkCommunicationLogs.id, communicationId))
      .limit(1);

    if (!communication[0]) {
      return NextResponse.json(
        { message: "Communication not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      communication: communication[0],
    });
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
