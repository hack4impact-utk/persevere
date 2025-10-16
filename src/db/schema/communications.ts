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
 * Communication and Messaging Schema
 *
 * This file contains tables for managing all communications between the system
 * and volunteers, including notifications, messages, and templates.
 *
 * Key features:
 * - Email and SMS notifications
 * - Mass communication capabilities
 * - Message templates for consistency
 * - Communication history and tracking
 *
 * Related files:
 * - users.ts: Volunteer contact information
 * - opportunities.ts: Event-related communications
 * - admin.ts: Administrative communication tools
 */

/**
 * Communication history and tracking
 *
 * Records all messages sent to volunteers for tracking, compliance, and debugging.
 * Includes both automated system messages and manual communications from staff.
 *
 * Message types:
 * - System notifications (RSVP confirmations, reminders)
 * - Administrative communications (announcements, updates)
 * - Opportunity-related messages (event details, changes)
 */
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "restrict" }), // Staff/admin who sent the message
  recipientId: integer("recipient_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "restrict" }), // Volunteer who received the message
  subject: text("subject").notNull(), // Message subject line
  body: text("body").notNull(), // Message content
  type: text("type").notNull(), // Communication type: email, sms, notification
  sentAt: timestamp("sent_at").defaultNow().notNull(), // Send timestamp
  status: text("status").default("sent").notNull(), // Delivery status: sent, delivered, failed
  relatedOpportunityId: integer("related_opportunity_id"), // Optional opportunity reference
});

/**
 * Reusable message templates
 *
 * Pre-defined message templates for consistent communication across the system.
 * Templates can include placeholders for dynamic content (volunteer names, dates, etc.).
 *
 * Template categories:
 * - welcome: New volunteer onboarding messages
 * - reminder: Event and deadline reminders
 * - confirmation: RSVP and registration confirmations
 * - newsletter: Regular updates and announcements
 */
export const communicationTemplates = pgTable("communication_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Template identifier
  subject: text("subject").notNull(), // Subject line template
  body: text("body").notNull(), // Message body template
  type: text("type").notNull(), // Communication type: email, sms, notification
  category: text("category"), // Template category for organization
  isActive: boolean("is_active").default(true).notNull(), // Active status
  createdAt: timestamp("created_at").defaultNow().notNull(), // Creation timestamp
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Last update timestamp
});

/**
 * Database Relations
 *
 * Defines relationships between communication tables and other entities.
 */

/**
 * Communication logs to volunteers relationship
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
