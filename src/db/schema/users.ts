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
 * VOLUNTEER MANAGEMENT MVP SCHEMA
 *
 * This schema supports the core volunteer management functionality
 * as defined in the Persevere PRD v2 MVP requirements:
 * - Volunteer Recruitment Portal
 * - Central Volunteer Database
 * - Matching Engine
 * - Admin Dashboard
 */

/**
 * Main volunteers table - Central database for all volunteers and staff
 * Supports searchable, filterable records with alumni tagging as required
 */
export const volunteers = pgTable("volunteers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(), // First name
  lastName: text("last_name").notNull(), // Last name
  email: text("email").unique().notNull(), // Unique email for login and communication
  password: text("password").notNull(), // Bcrypt hashed password for authentication
  phone: text("phone"), // Phone number for SMS notifications
  bio: text("bio"), // Volunteer biography/description
  role: volunteerRoleEnum("role").notNull(), // Volunteer role (mentor, guest_speaker, flexible, staff, admin)
  isAlumni: boolean("is_alumni").default(false).notNull(), // Alumni tag as required by PRD
  /**
   * Tracks background check status; required only for volunteers who interact with youth.
   * Default is 'not_required'.
   */
  backgroundCheckStatus: backgroundCheckStatusEnum("background_check_status")
    .default("not_required")
    .notNull(),
  mediaRelease: boolean("media_release").default(false).notNull(), // Media release consent
  profilePicture: text("profile_picture"), // Profile picture URL (stretch goal)
  availability: jsonb("availability"), // JSON object storing availability schedule
  // Communication preferences
  notificationPreference: notificationPreferenceEnum("notification_preference")
    .default("email")
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(), // Whether volunteer is currently active
  isEmailVerified: boolean("is_email_verified").default(false).notNull(), // Email verification status
  createdAt: timestamp("created_at").defaultNow().notNull(), // Account creation timestamp
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Last update timestamp
});

/**
 * SKILLS MANAGEMENT FOR VOLUNTEER MATCHING
 *
 * Skills system enables the matching engine to suggest volunteers
 * based on their abilities and proficiency levels
 */

/**
 * Skills table - Master list of all available skills for volunteer matching
 * Examples: "JavaScript", "Python", "Mentoring", "Public Speaking", "First Aid"
 */
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Skill name (e.g., "JavaScript", "Mentoring")
  description: text("description"), // Optional detailed description of the skill
  category: text("category"), // Skill category (e.g., "Technical", "Soft Skills", "Safety")
});

/**
 * Volunteer-Skills junction table - Links volunteers to their skills with proficiency levels
 * Many-to-many relationship between volunteers and skills for matching engine
 * Uses composite primary key for better performance
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
 * INTERESTS MANAGEMENT FOR VOLUNTEER MATCHING
 *
 * Interests system helps recommend relevant opportunities to volunteers
 * and enables better volunteer-opportunity matching
 */

/**
 * Interests table - Master list of all available interest categories
 * Examples: "Tech Education", "Mentoring", "Community Outreach", "Youth Development"
 */
export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Interest name (e.g., "Tech Education", "Mentoring")
  description: text("description"), // Optional description of the interest category
});

/**
 * Volunteer-Interests junction table - Links volunteers to their interests
 * Many-to-many relationship between volunteers and interests
 * Uses composite primary key for better performance
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
