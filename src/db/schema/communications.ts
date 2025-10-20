import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./users";

// Communication logs - tracks all messages sent between users
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  recipientId: integer("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  status: text("status").default("sent").notNull(),
  relatedOpportunityId: integer("related_opportunity_id"),
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
export const communicationLogsRelations = relations(
  communicationLogs,
  ({ one }) => ({
    sender: one(users, {
      fields: [communicationLogs.senderId],
      references: [users.id],
      relationName: "SentCommunications",
    }),
    recipient: one(users, {
      fields: [communicationLogs.recipientId],
      references: [users.id],
      relationName: "ReceivedCommunications",
    }),
  }),
);
