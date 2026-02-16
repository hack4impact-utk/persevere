import { and, desc, eq, ilike, or } from "drizzle-orm";

import db from "@/db";
import {
  admin,
  bulkCommunicationLogs,
  staff,
  users,
  volunteers,
} from "@/db/schema";
import { NotFoundError } from "@/utils/errors";
import { sendBulkEmail } from "@/utils/server/email";

type CommunicationRecord = {
  id: number;
  senderId: number;
  subject: string;
  body: string;
  recipientType: string;
  sentAt: Date;
  status: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

export type CreateCommunicationInput = {
  subject: string;
  body: string;
  recipientType: "volunteers" | "staff" | "both";
  senderEmail: string;
  senderRole: string;
};

export type CommunicationListFilters = {
  page: number;
  limit: number;
  search?: string | null;
};

const communicationSelect = {
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
};

/**
 * Lists communications with optional search and pagination.
 */
export async function listCommunications(
  filters: CommunicationListFilters,
): Promise<{
  communications: CommunicationRecord[];
  total: number;
  page: number;
  limit: number;
}> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;

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
    .select(communicationSelect)
    .from(bulkCommunicationLogs)
    .leftJoin(users, eq(bulkCommunicationLogs.senderId, users.id))
    .orderBy(desc(bulkCommunicationLogs.sentAt));

  const filteredQuery =
    whereClauses.length > 0 ? baseQuery.where(and(...whereClauses)) : baseQuery;

  const countQuery = db
    .select({ count: bulkCommunicationLogs.id })
    .from(bulkCommunicationLogs);
  const filteredCountQuery =
    whereClauses.length > 0
      ? countQuery.where(and(...whereClauses))
      : countQuery;

  const [communications, totalResult] = await Promise.all([
    filteredQuery.limit(limit).offset(offset),
    filteredCountQuery,
  ]);

  return { communications, total: totalResult.length, page, limit };
}

/**
 * Creates a bulk communication log and sends emails to recipients.
 * Throws if the sender is not found or the staff role tries to send to non-volunteers.
 */
export async function createCommunication(
  input: CreateCommunicationInput,
): Promise<{
  communication: CommunicationRecord | undefined;
  emailSent: boolean;
  emailError: boolean;
  recipientCount: number;
  emailResult?: {
    successCount: number;
    failureCount: number;
    failures: { email: string; error: string }[];
  };
}> {
  const senderUserResult = await db
    .select()
    .from(users)
    .where(eq(users.email, input.senderEmail))
    .limit(1);

  const senderUser = senderUserResult[0];
  if (!senderUser) {
    throw new NotFoundError("Sender user not found");
  }

  const newCommunication = await db
    .insert(bulkCommunicationLogs)
    .values({
      senderId: senderUser.id,
      subject: input.subject,
      body: input.body,
      recipientType: input.recipientType,
      status: "sent",
    })
    .returning();

  if (!newCommunication[0]) {
    throw new Error("Failed to create communication");
  }

  let recipientEmails: string[] = [];

  switch (input.recipientType) {
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
      const [volunteerUsers, staffUsers] = await Promise.all([
        db
          .select({ email: users.email })
          .from(volunteers)
          .innerJoin(users, eq(volunteers.userId, users.id))
          .where(eq(users.isActive, true)),
        db
          .select({ email: users.email })
          .from(staff)
          .innerJoin(users, eq(staff.userId, users.id))
          .where(eq(users.isActive, true)),
      ]);
      recipientEmails = [
        ...volunteerUsers.map((v) => v.email),
        ...staffUsers.map((s) => s.email),
      ];
      break;
    }
  }

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
        input.subject,
        input.body,
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

  const createdResult = await db
    .select(communicationSelect)
    .from(bulkCommunicationLogs)
    .leftJoin(users, eq(bulkCommunicationLogs.senderId, users.id))
    .where(eq(bulkCommunicationLogs.id, newCommunication[0].id))
    .limit(1);

  return {
    communication: createdResult[0],
    emailSent,
    emailError,
    recipientCount: recipientEmails.length,
    emailResult: emailResult ?? undefined,
  };
}
