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
  volunteerRoleEnum,
} from "./enums";

/**
 * Core User and Volunteer Management Schema
 *
 * This file contains the primary user tables for the volunteer management system.
 * It includes both the main volunteers table and the NextAuth.js adapter tables.
 *
 * Key design decisions:
 * - Single volunteers table for all user types (volunteers, staff, admins)
 * - Role-based access control through the role field
 * - Optional volunteerType for specific volunteer categories
 * - NextAuth tables for authentication integration
 *
 * Related files:
 * - opportunities.ts: Event and opportunity management
 * - communications.ts: Messaging and notifications
 * - enums.ts: Shared enum definitions
 */

/**
 * Central user table for all system users
 *
 * This table stores all users regardless of their role (volunteer, staff, admin).
 * The role field determines access permissions, while volunteerType provides
 * additional categorization for volunteers.
 *
 * Authentication: Uses email/password with bcrypt hashing
 * Access Control: Role-based permissions via middleware
 * Data Integrity: Email uniqueness enforced at database level
 */
export const volunteers = pgTable("volunteers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(), // User's first name
  lastName: text("last_name").notNull(), // User's last name
  email: text("email").unique().notNull(), // Login identifier and primary contact method
  password: text("password").notNull(), // Bcrypt hashed password (never store plaintext)
  phone: text("phone"), // Optional phone for SMS notifications
  bio: text("bio"), // User biography/description for profiles
  role: volunteerRoleEnum("role").notNull(), // Access control: volunteer | staff | admin
  volunteerType: text("volunteer_type"), // Volunteer specialization: mentor | speaker | flexible
  isAlumni: boolean("is_alumni").default(false).notNull(), // Alumni status for tracking
  /**
   * Background check status for safety compliance
   * Required for volunteers working with minors or vulnerable populations
   */
  backgroundCheckStatus: backgroundCheckStatusEnum("background_check_status")
    .default("not_required")
    .notNull(),
  mediaRelease: boolean("media_release").default(false).notNull(), // Consent for photos/videos
  profilePicture: text("profile_picture"), // URL to profile image
  availability: jsonb("availability"), // JSON schedule preferences (flexible format)
  notificationPreference: notificationPreferenceEnum("notification_preference")
    .default("email")
    .notNull(), // How user wants to receive notifications
  isActive: boolean("is_active").default(true).notNull(), // Account active status
  isEmailVerified: boolean("is_email_verified").default(false).notNull(), // Email verification
  createdAt: timestamp("created_at").defaultNow().notNull(), // Account creation time
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Last modification time
});

/**
 * Skills and Interests Management
 *
 * These tables support the volunteer-opportunity matching system by tracking
 * what volunteers can do and what opportunities require.
 */

/**
 * Master skills catalog
 *
 * Contains all available skills that volunteers can have or opportunities can require.
 * Used for matching volunteers to appropriate opportunities based on their abilities.
 *
 * Examples: "JavaScript", "Python", "Mentoring", "Public Speaking", "First Aid"
 */
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Skill name (e.g., "JavaScript", "Mentoring")
  description: text("description"), // Detailed description of the skill
  category: text("category"), // Grouping: "Technical", "Soft Skills", "Safety", etc.
});

/**
 * Volunteer-Skills many-to-many relationship
 *
 * Links volunteers to their skills with proficiency levels.
 * Used by the matching algorithm to find volunteers with appropriate abilities.
 *
 * Composite primary key: (volunteerId, skillId) ensures no duplicate entries
 */
export const volunteerSkills = pgTable(
  "volunteer_skills",
  {
    volunteerId: integer("volunteer_id")
      .notNull()
      .references(() => volunteers.id, { onDelete: "cascade" }), // Foreign key to volunteers
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }), // Foreign key to skills
    level: proficiencyLevelEnum("level").notNull(), // Volunteer's proficiency level for this skill
  },
  (table) => {
    return {
      // Composite primary key for better performance and data integrity
      pk: primaryKey({ columns: [table.volunteerId, table.skillId] }),
    };
  },
);

/**
 * Interest Categories
 *
 * Helps match volunteers to opportunities based on their interests and passions.
 * Different from skills - interests are about what volunteers want to do,
 * while skills are about what they can do.
 *
 * Examples: "Tech Education", "Mentoring", "Community Outreach", "Youth Development"
 */
export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Interest category name
  description: text("description"), // Detailed description of the interest
});

/**
 * Volunteer-Interests many-to-many relationship
 *
 * Links volunteers to their interest categories for opportunity recommendations.
 * Used to suggest relevant opportunities based on volunteer preferences.
 */
export const volunteerInterests = pgTable(
  "volunteer_interests",
  {
    volunteerId: integer("volunteer_id")
      .notNull()
      .references(() => volunteers.id, { onDelete: "cascade" }), // Foreign key to volunteers
    interestId: integer("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }), // Foreign key to interests
  },
  (table) => {
    return {
      // Composite primary key for better performance and data integrity
      pk: primaryKey({ columns: [table.volunteerId, table.interestId] }),
    };
  },
);

/**
 * DRIZZLE RELATIONS
 *
 * These relations define how volunteer management tables are connected for querying
 * They enable easy joins and nested data fetching for the matching engine
 */

/**
 * Volunteer relations - Defines how volunteers connect to other entities
 */
export const volunteersRelations = relations(volunteers, ({ many }) => ({
  skills: many(volunteerSkills), // Each volunteer can have many skills
  interests: many(volunteerInterests), // Each volunteer can have many interests
}));

/**
 * Skills relations - Defines how skills connect to volunteers
 */
export const skillsRelations = relations(skills, ({ many }) => ({
  volunteers: many(volunteerSkills), // Each skill can be associated with many volunteers
}));

/**
 * Volunteer-Skills relations - Junction table relations
 */
export const volunteerSkillsRelations = relations(
  volunteerSkills,
  ({ one }) => ({
    volunteer: one(volunteers, {
      fields: [volunteerSkills.volunteerId],
      references: [volunteers.id],
    }), // Each volunteer-skill belongs to one volunteer
    skill: one(skills, {
      fields: [volunteerSkills.skillId],
      references: [skills.id],
    }), // Each volunteer-skill belongs to one skill
  }),
);

/**
 * Interests relations - Defines how interests connect to volunteers
 */
export const interestsRelations = relations(interests, ({ many }) => ({
  volunteers: many(volunteerInterests), // Each interest can be associated with many volunteers
}));

/**
 * Volunteer-Interests relations - Junction table relations
 */
export const volunteerInterestsRelations = relations(
  volunteerInterests,
  ({ one }) => ({
    volunteer: one(volunteers, {
      fields: [volunteerInterests.volunteerId],
      references: [volunteers.id],
    }), // Each volunteer-interest belongs to one volunteer
    interest: one(interests, {
      fields: [volunteerInterests.interestId],
      references: [interests.id],
    }), // Each volunteer-interest belongs to one interest
  }),
);

/**
 * NextAuth.js Integration Tables
 *
 * These tables are required by the NextAuth.js DrizzleAdapter for authentication.
 * They work alongside the main volunteers table to provide session management
 * and OAuth provider integration.
 *
 * Note: The main user data is stored in the volunteers table. These tables
 * are primarily for NextAuth.js internal session management.
 */

/**
 * NextAuth.js user records
 *
 * Stores minimal user data for NextAuth.js session management.
 * The main user data (profile, role, etc.) is stored in the volunteers table.
 */
export const users = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  name: text("name"), // Display name
  email: text("email"), // Email address
  emailVerified: timestamp("emailVerified"), // Email verification timestamp
  image: text("image"), // Profile image URL
});

/**
 * OAuth provider account linking
 *
 * Links NextAuth users to their external OAuth accounts (Google, GitHub, etc.).
 * Not currently used since we use credentials provider, but required by NextAuth.
 */
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
  (table) => {
    return {
      // Composite primary key
      pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
    };
  },
);

/**
 * User session management
 *
 * Stores active user sessions for authentication state.
 * Currently using JWT strategy, so this table is mainly for NextAuth compatibility.
 */
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey().notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

/**
 * Email verification and password reset tokens
 *
 * Stores secure tokens for email verification and password reset flows.
 * Tokens have expiration times for security.
 */
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => {
    return {
      // Composite primary key
      pk: primaryKey({ columns: [table.identifier, table.token] }),
    };
  },
);
