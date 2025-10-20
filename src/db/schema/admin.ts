import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./users";

// Admin dashboard actions - audit log for admin activities
export const adminDashboardActions = pgTable("admin_dashboard_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  actionType: text("action_type").notNull(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System settings - configurable application settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedById: integer("updated_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table relationships
export const adminDashboardActionsRelations = relations(
  adminDashboardActions,
  ({ one }) => ({
    admin: one(users, {
      fields: [adminDashboardActions.adminId],
      references: [users.id],
    }),
  }),
);

export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updatedBy: one(users, {
    fields: [systemSettings.updatedById],
    references: [users.id],
  }),
}));
