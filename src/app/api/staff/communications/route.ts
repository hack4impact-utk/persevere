import { and, desc, eq, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import db from "@/db";
import {
  admin,
  bulkCommunicationLogs,
  staff,
  users,
  volunteers,
} from "@/db/schema";
import handleError from "@/utils/handle-error";
import { sendBulkEmail } from "@/utils/server/email";

const createCommunicationSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  recipientType: z.enum(["volunteers", "staff", "both"]),
});

export async function GET(request: Request): Promise<NextResponse> {
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

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // Build query with sender info
    const whereClauses = [];
    if (search) {
      whereClauses.push(
        or(
          ilike(bulkCommunicationLogs.subject, `%${search}%`),
          ilike(bulkCommunicationLogs.body, `%${search}%`),
        ),
      );
    }

    const baseQuery = db
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
      .orderBy(desc(bulkCommunicationLogs.sentAt));

    // Apply search filter if provided
    const filteredQuery =
      whereClauses.length > 0
        ? baseQuery.where(and(...whereClauses))
        : baseQuery;

    // Get total count
    const countQuery = db
      .select({ count: bulkCommunicationLogs.id })
      .from(bulkCommunicationLogs);

    const filteredCountQuery =
      whereClauses.length > 0
        ? countQuery.where(and(...whereClauses))
        : countQuery;

    const totalResult = await filteredCountQuery;
    const total = totalResult.length;

    // Get paginated results
    const communications = await filteredQuery.limit(limit).offset(offset);

    return NextResponse.json({
      communications,
      total,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only staff and admin can create communications
    if (!session.user.role || !["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await request.json();

    // Validate the request body
    const result = createCommunicationSchema.safeParse(json);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { message: firstError.message },
        { status: 400 },
      );
    }

    const data = result.data;

    // Role-based validation: staff can only send to volunteers
    if (session.user.role === "staff" && data.recipientType !== "volunteers") {
      return NextResponse.json(
        { message: "Staff can only send communications to volunteers" },
        { status: 403 },
      );
    }

    // Get sender user ID from session
    const senderUserResult = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email || ""))
      .limit(1);

    const senderUser = senderUserResult[0];

    if (!senderUser) {
      return NextResponse.json(
        { message: "Sender user not found" },
        { status: 404 },
      );
    }

    // Create the bulk communication log
    const newCommunication = await db
      .insert(bulkCommunicationLogs)
      .values({
        senderId: senderUser.id,
        subject: data.subject,
        body: data.body,
        recipientType: data.recipientType,
        status: "sent",
      })
      .returning();

    if (!newCommunication[0]) {
      throw new Error("Failed to create communication");
    }

    // Fetch recipient email addresses based on recipientType
    let recipientEmails: string[] = [];

    switch (data.recipientType) {
      case "volunteers": {
        const volunteerUsers = await db
          .select({ email: users.email })
          .from(volunteers)
          .innerJoin(users, eq(volunteers.userId, users.id))
          .where(eq(users.isActive, true));
        recipientEmails = volunteerUsers.map((v) => v.email);

        break;
      }
      case "staff": {
        const staffUsers = await db
          .select({ email: users.email })
          .from(staff)
          .innerJoin(users, eq(staff.userId, users.id))
          .leftJoin(admin, eq(staff.id, admin.staffId))
          .where(eq(users.isActive, true));
        recipientEmails = staffUsers.map((s) => s.email);

        break;
      }
      case "both": {
        // Get both volunteers and staff
        const volunteerUsers = await db
          .select({ email: users.email })
          .from(volunteers)
          .innerJoin(users, eq(volunteers.userId, users.id))
          .where(eq(users.isActive, true));

        const staffUsers = await db
          .select({ email: users.email })
          .from(staff)
          .innerJoin(users, eq(staff.userId, users.id))
          .where(eq(users.isActive, true));

        recipientEmails = [
          ...volunteerUsers.map((v) => v.email),
          ...staffUsers.map((s) => s.email),
        ];

        break;
      }
      // No default
    }

    // Send emails (non-blocking - don't fail the request if email fails)
    let emailSent = false;
    let emailError = false;
    let emailResult: {
      successCount: number;
      failureCount: number;
      failures: { email: string; error: string }[];
    } | null = null;

    if (recipientEmails.length > 0) {
      try {
        emailResult = await sendBulkEmail(
          recipientEmails,
          data.subject,
          data.body,
        );
        emailSent = emailResult.successCount > 0;
        emailError = emailResult.failureCount > 0;
        if (emailResult.failures.length > 0) {
          console.error("Some emails failed to send:", emailResult.failures);
        }
      } catch (error) {
        console.error("Failed to send bulk emails:", error);
        emailError = true;
      }
    }

    // Fetch the created communication with sender info
    const createdCommunicationResult = await db
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
      .where(eq(bulkCommunicationLogs.id, newCommunication[0].id))
      .limit(1);

    const createdCommunication = createdCommunicationResult[0];

    return NextResponse.json(
      {
        communication: createdCommunication,
        emailSent,
        emailError,
        recipientCount: recipientEmails.length,
        emailResult: emailResult || undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: handleError(error) }, { status: 500 });
  }
}
