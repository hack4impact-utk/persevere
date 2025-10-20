import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import {
  backgroundCheckStatusEnum,
  notificationPreferenceEnum,
  proficiencyLevelEnum,
} from "./enums";

// Core user table - shared by all user types (volunteers, staff, admin)
// nextAuthId links to NextAuth.js sessions
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nextAuthId: text("nextauth_id").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  phone: text("phone"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  isActive: boolean("is_active").default(true).notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Volunteer-specific data - references users table
export const volunteers = pgTable("volunteers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  volunteerType: text("volunteer_type"),
  isAlumni: boolean("is_alumni").default(false).notNull(),
  backgroundCheckStatus: backgroundCheckStatusEnum("background_check_status")
    .default("not_required")
    .notNull(),
  mediaRelease: boolean("media_release").default(false).notNull(),
  availability: jsonb("availability"),
  notificationPreference: notificationPreferenceEnum("notification_preference")
    .default("email")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Staff-specific data - references users table
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  notificationPreference: notificationPreferenceEnum("notification_preference")
    .default("email")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Admin data - extends staff with admin-specific fields
export const admin = pgTable("admin", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Skills catalog - available skills volunteers can have
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
});

// Interests catalog - available interests volunteers can have
export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

// Many-to-many: volunteers and their skills with proficiency levels
export const volunteerSkills = pgTable(
  "volunteer_skills",
  {
    volunteerId: integer("volunteer_id")
      .notNull()
      .references(() => volunteers.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    level: proficiencyLevelEnum("level").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.volunteerId, table.skillId] }),
  }),
);

// Many-to-many: volunteers and their interests
export const volunteerInterests = pgTable(
  "volunteer_interests",
  {
    volunteerId: integer("volunteer_id")
      .notNull()
      .references(() => volunteers.id, { onDelete: "cascade" }),
    interestId: integer("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.volunteerId, table.interestId] }),
  }),
);

// NextAuth.js accounts table - OAuth provider accounts
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.nextAuthId, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
  }),
);

// NextAuth.js sessions table - user sessions
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey().notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.nextAuthId, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

// NextAuth.js verification tokens - for email verification, password reset
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

// Table relationships - define how tables connect to each other
export const usersRelations = relations(users, ({ one, many }) => ({
  volunteer: one(volunteers),
  staff: one(staff),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const volunteersRelations = relations(volunteers, ({ one, many }) => ({
  user: one(users, {
    fields: [volunteers.userId],
    references: [users.id],
  }),
  skills: many(volunteerSkills),
  interests: many(volunteerInterests),
}));

export const staffRelations = relations(staff, ({ one }) => ({
  user: one(users, {
    fields: [staff.userId],
    references: [users.id],
  }),
  admin: one(admin),
}));

export const adminRelations = relations(admin, ({ one }) => ({
  staff: one(staff, {
    fields: [admin.staffId],
    references: [staff.id],
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  volunteers: many(volunteerSkills),
}));

export const volunteerSkillsRelations = relations(
  volunteerSkills,
  ({ one }) => ({
    volunteer: one(volunteers, {
      fields: [volunteerSkills.volunteerId],
      references: [volunteers.id],
    }),
    skill: one(skills, {
      fields: [volunteerSkills.skillId],
      references: [skills.id],
    }),
  }),
);

export const interestsRelations = relations(interests, ({ many }) => ({
  volunteers: many(volunteerInterests),
}));

export const volunteerInterestsRelations = relations(
  volunteerInterests,
  ({ one }) => ({
    volunteer: one(volunteers, {
      fields: [volunteerInterests.volunteerId],
      references: [volunteers.id],
    }),
    interest: one(interests, {
      fields: [volunteerInterests.interestId],
      references: [interests.id],
    }),
  }),
);
