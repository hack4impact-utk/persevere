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
 * ADMIN DASHBOARD MVP SCHEMA
 *
 * This schema supports the admin dashboard functionality
 * as defined in the Persevere PRD v2 MVP requirements:
 * - Full visibility of all volunteer records and engagement history
 * - Add/edit/remove volunteer records
 * - Manage and publish volunteer opportunities
 * - View analytics and export data for grants
 * - Send mass communications
 */

/**
 * Admin Dashboard Actions table - Logs all administrative actions
 * This provides an audit trail for admin activities and system changes
 * Supports the admin dashboard oversight requirement from PRD
 */
export const adminDashboardActions = pgTable("admin_dashboard_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "restrict" }), // Which admin performed the action
  actionType: text("action_type").notNull(), // Type of action (e.g., "volunteer_created", "opportunity_updated", "mass_communication_sent")
  targetType: text("target_type").notNull(), // What type of entity was affected (e.g., "volunteer", "opportunity", "communication")
  targetId: integer("target_id"), // ID of the specific entity affected (null if action doesn't target a specific entity)
  details: jsonb("details"), // Additional action details stored as JSON (e.g., old values, new values, metadata)
  createdAt: timestamp("created_at").defaultNow().notNull(), // When the action was performed
});

/**
 * System Settings table - Stores system-wide configuration settings
 * This supports admin dashboard configuration management
 */
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(), // Setting key (e.g., "max_volunteers_per_opportunity", "default_notification_hours")
  value: jsonb("value").notNull(), // Setting value stored as JSON
  description: text("description"), // Human-readable description of the setting
  updatedById: integer("updated_by_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "restrict" }), // Who last updated this setting
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // When the setting was last updated
});

/**
 * DRIZZLE RELATIONS
 *
 * These relations define how admin tables are connected for querying
 */

/**
 * Admin Dashboard Actions relations - Defines how actions connect to volunteers
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
