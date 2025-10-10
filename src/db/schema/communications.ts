import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { volunteers } from "./users"; // Import volunteers

/**
 * VOLUNTEER COMMUNICATION TOOLS MVP SCHEMA
 *
 * This schema supports the volunteer communication functionality
 * as defined in the Persevere PRD v2 MVP requirements:
 * - Email notifications and reminders
 * - SMS notifications (cost dependent)
 * - Mass communications from admin
 * - Communication templates
 */

/**
 * Communication Logs table - Stores all messages sent to volunteers
 * This includes both system-generated and admin-generated communications
 * Supports email and SMS notifications as required by PRD
 */
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "restrict" }), // Who sent the message (staff/admin)
  recipientId: integer("recipient_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "restrict" }), // Who received the message
  subject: text("subject").notNull(), // Message subject line
  body: text("body").notNull(), // Message content/body
  type: text("type").notNull(), // Message type: "email", "sms", "notification"
  sentAt: timestamp("sent_at").defaultNow().notNull(), // When the message was sent
  status: text("status").default("sent").notNull(), // Message status: "sent", "delivered", "failed"
  relatedOpportunityId: integer("related_opportunity_id"), // Optional reference to related opportunity
});

/**
 * Communication Templates table - Stores reusable message templates
 * These can be used for system notifications, automated messages, etc.
 * Supports the admin communication tools requirement from PRD
 */
export const communicationTemplates = pgTable("communication_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Template name (e.g., "Welcome Email", "Event Reminder", "RSVP Confirmation")
  subject: text("subject").notNull(), // Template subject line
  body: text("body").notNull(), // Template message body
  type: text("type").notNull(), // Template type: "email", "sms", "notification"
  category: text("category"), // Template category: "welcome", "reminder", "confirmation", "newsletter"
  isActive: boolean("is_active").default(true).notNull(), // Whether template is currently active
  createdAt: timestamp("created_at").defaultNow().notNull(), // When template was created
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // When template was last updated
});

/**
 * DRIZZLE RELATIONS
 *
 * These relations define how communication tables are connected for querying
 */

/**
 * Communication Logs relations - Defines how messages connect to volunteers
 */
export const communicationLogsRelations = relations(
  communicationLogs,
  ({ one }) => ({
    sender: one(volunteers, {
      fields: [communicationLogs.senderId],
      references: [volunteers.id],
      relationName: "SentCommunications",
    }), // Each message has one sender (staff/admin)
    recipient: one(volunteers, {
      fields: [communicationLogs.recipientId],
      references: [volunteers.id],
      relationName: "ReceivedCommunications",
    }), // Each message has one recipient (volunteer)
  }),
);
