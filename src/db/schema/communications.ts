import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { recipientTypeEnum } from "./enums";
import { users } from "./users";

// Communication logs - tracks all messages sent between users
// NOTE: Commented out for potential future use (one-to-one messaging features)
// export const communicationLogs = pgTable("communication_logs", {
//   id: serial("id").primaryKey(),
//   senderId: integer("sender_id")
//     .notNull()
//     .references(() => users.id, { onDelete: "restrict" }),
//   recipientId: integer("recipient_id")
//     .notNull()
//     .references(() => users.id, { onDelete: "restrict" }),
//   subject: text("subject").notNull(),
//   body: text("body").notNull(),
//   type: text("type").notNull(),
//   sentAt: timestamp("sent_at").defaultNow().notNull(),
//   status: text("status").default("sent").notNull(),
//   relatedOpportunityId: integer("related_opportunity_id"),
// });

// Bulk communication logs - tracks bulk messages sent to groups (volunteers, staff, or both)
export const bulkCommunicationLogs = pgTable("bulk_communication_logs", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  recipientType: recipientTypeEnum("recipient_type").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  status: text("status").default("sent").notNull(),
});

// Communication templates - reusable message templates for consistency
export const communicationTemplates = pgTable("communication_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(),
  category: text("category"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table relationships
// NOTE: Commented out for potential future use
// export const communicationLogsRelations = relations(
//   communicationLogs,
//   ({ one }) => ({
//     sender: one(users, {
//       fields: [communicationLogs.senderId],
//       references: [users.id],
//       relationName: "SentCommunications",
//     }),
//     recipient: one(users, {
//       fields: [communicationLogs.recipientId],
//       references: [users.id],
//       relationName: "ReceivedCommunications",
//     }),
//   }),
// );

// Bulk communication logs relations
export const bulkCommunicationLogsRelations = relations(
  bulkCommunicationLogs,
  ({ one }) => ({
    sender: one(users, {
      fields: [bulkCommunicationLogs.senderId],
      references: [users.id],
      relationName: "SentBulkCommunications",
    }),
  }),
);
