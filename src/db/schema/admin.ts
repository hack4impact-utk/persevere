import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { volunteers } from "./users"; // Import volunteers

/**
 * Administrative Management Schema
 *
 * This file contains tables for administrative functions and system management.
 * These tables support admin dashboard functionality and system-wide operations.
 *
 * Key features:
 * - Audit logging for administrative actions
 * - System configuration and settings
 * - Administrative oversight and reporting
 *
 * Related files:
 * - users.ts: User and volunteer management
 * - opportunities.ts: Event and opportunity management
 * - communications.ts: Messaging and notifications
 */

/**
 * Administrative action audit log
 *
 * Tracks all administrative actions for compliance, debugging, and oversight.
 * Provides a complete audit trail of who did what and when.
 *
 * Use cases:
 * - Compliance reporting and audits
 * - Debugging system issues
 * - Administrative oversight and accountability
 * - User activity monitoring
 */
export const adminDashboardActions = pgTable("admin_dashboard_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "restrict" }), // Admin who performed the action
  actionType: text("action_type").notNull(), // Action type: "volunteer_created", "opportunity_updated", etc.
  targetType: text("target_type").notNull(), // Entity type affected: "volunteer", "opportunity", etc.
  targetId: integer("target_id"), // ID of affected entity (null for system-wide actions)
  details: jsonb("details"), // Additional context: old values, metadata, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(), // Action timestamp
});

/**
 * System configuration settings
 *
 * Stores application-wide configuration that can be modified by administrators.
 * Settings are stored as JSON to allow flexible data types.
 *
 * Examples:
 * - max_volunteers_per_opportunity: 50
 * - default_notification_hours: 24
 * - system_maintenance_mode: false
 */
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(), // Setting identifier
  value: jsonb("value").notNull(), // Setting value (flexible JSON format)
  description: text("description"), // Human-readable description
  updatedById: integer("updated_by_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "restrict" }), // Admin who last updated
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Last update timestamp
});

/**
 * Database Relations
 *
 * Defines relationships between admin tables and other entities for querying.
 */

/**
 * Admin actions to volunteers relationship
 */
export const adminDashboardActionsRelations = relations(
  adminDashboardActions,
  ({ one }) => ({
    admin: one(volunteers, {
      fields: [adminDashboardActions.adminId],
      references: [volunteers.id],
    }), // Each action is performed by one admin volunteer
  }),
);

/**
 * System Settings relations - Defines how settings connect to volunteers
 */
export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updatedBy: one(volunteers, {
    fields: [systemSettings.updatedById],
    references: [volunteers.id],
  }), // Each setting is updated by one volunteer (admin)
}));
