import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { opportunityStatusEnum, rsvpStatusEnum } from "./enums"; // Import enums
import { interests, skills, volunteers } from "./users"; // Import dependencies

/**
 * EVENT & ENGAGEMENT CALENDAR MVP SCHEMA
 *
 * This schema supports the event/engagement calendar functionality
 * as defined in the Persevere PRD v2 MVP requirements:
 * - Event & Engagement Calendar
 * - RSVP/Signup functionality
 * - Volunteer hours tracking
 * - Matching Engine support
 */

/**
 * Main opportunities table - Stores all volunteer opportunities and events
 * Supports recurring scheduling and RSVP/signup functionality as required
 */
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Opportunity title (e.g., "JavaScript Mentoring Session", "Guest Speaker Event")
  description: text("description").notNull(), // Detailed description of the opportunity
  location: text("location").notNull(), // Location description (e.g., "Community Center", "123 Main St")
  startDate: timestamp("start_date").notNull(), // When the opportunity starts
  endDate: timestamp("end_date").notNull(), // When the opportunity ends
  status: opportunityStatusEnum("status").default("open").notNull(), // Current status of the opportunity
  maxVolunteers: integer("max_volunteers"), // Maximum number of volunteers (null = unlimited)
  createdById: integer("created_by_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "restrict" }), // Who created this opportunity (staff/admin)
  recurrencePattern: jsonb("recurrence_pattern"), // JSON object for recurring opportunities (e.g., weekly, monthly)
  isRecurring: boolean("is_recurring").default(false).notNull(), // Whether this is a recurring opportunity
  createdAt: timestamp("created_at").defaultNow().notNull(), // When the opportunity was created
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // When the opportunity was last updated
});

/**
 * OPPORTUNITY SKILLS MATCHING FOR MATCHING ENGINE
 *
 * Links opportunities to required skills for better volunteer matching
 * Supports the matching engine requirement from PRD
 */

/**
 * Opportunity-Required Skills junction table
 * Defines which skills are required for each opportunity
 * Uses composite primary key for better performance
 */
export const opportunityRequiredSkills = pgTable(
  "opportunity_required_skills",
  {
    opportunityId: integer("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }), // Foreign key to opportunities
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }), // Foreign key to skills
  },
  (table) => {
    return {
      // Composite primary key for better performance and data integrity
      pk: primaryKey({ columns: [table.opportunityId, table.skillId] }),
    };
  },
);

/**
 * OPPORTUNITY INTERESTS MATCHING FOR MATCHING ENGINE
 *
 * Links opportunities to interest categories for better volunteer matching
 * Supports the matching engine requirement from PRD
 */

/**
 * Opportunity-Interests junction table
 * Defines which interest categories each opportunity belongs to
 * Uses composite primary key for better performance
 */
export const opportunityInterests = pgTable(
  "opportunity_interests",
  {
    opportunityId: integer("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }), // Foreign key to opportunities
    interestId: integer("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }), // Foreign key to interests
  },
  (table) => {
    return {
      // Composite primary key for better performance and data integrity
      pk: primaryKey({ columns: [table.opportunityId, table.interestId] }),
    };
  },
);

/**
 * RSVP/SIGNUP MANAGEMENT
 *
 * Tracks volunteer RSVPs and signups for opportunities
 * Supports the RSVP/signup functionality requirement from PRD
 */

/**
 * Volunteer RSVPs table
 * Tracks when volunteers RSVP/signup for opportunities and their status
 * Uses composite primary key for better performance
 */
export const volunteerRsvps = pgTable(
  "volunteer_rsvps",
  {
    volunteerId: integer("volunteer_id")
      .notNull()
      .references(() => volunteers.id, { onDelete: "cascade" }), // Foreign key to volunteers
    opportunityId: integer("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }), // Foreign key to opportunities
    status: rsvpStatusEnum("status").default("pending").notNull(), // Current RSVP status
    rsvpAt: timestamp("rsvp_at").defaultNow().notNull(), // When the RSVP was submitted
    notes: text("notes"), // Optional notes from volunteer
  },
  (table) => {
    return {
      // Composite primary key for better performance and data integrity
      pk: primaryKey({ columns: [table.volunteerId, table.opportunityId] }),
    };
  },
);

/**
 * VOLUNTEER HOURS TRACKING FOR REPORTING & ANALYTICS
 *
 * Records actual volunteer hours worked for reporting and recognition
 * Supports the reporting & analytics requirement from PRD
 */

/**
 * Volunteer Hours table
 * Tracks actual hours worked by volunteers for each opportunity
 * Used for grant reporting and internal analytics
 */
export const volunteerHours = pgTable("volunteer_hours", {
  id: serial("id").primaryKey(),
  volunteerId: integer("volunteer_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "cascade" }), // Foreign key to volunteers
  opportunityId: integer("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }), // Foreign key to opportunities
  date: timestamp("date").notNull(), // Date when hours were worked
  hours: real("hours").notNull(), // Number of hours worked (supports decimal values like 2.5)
  notes: text("notes"), // Optional notes about the volunteer session
  verifiedBy: integer("verified_by").references(() => volunteers.id, {
    onDelete: "set null",
  }), // Who verified these hours (staff/admin)
  verifiedAt: timestamp("verified_at"), // When the hours were verified
});

/**
 * DRIZZLE RELATIONS
 *
 * These relations define how opportunity tables are connected for querying
 * They support the matching engine and calendar functionality
 */

/**
 * Opportunities relations - Defines how opportunities connect to other entities
 */
export const opportunitiesRelations = relations(
  opportunities,
  ({ one, many }) => ({
    createdBy: one(volunteers, {
      fields: [opportunities.createdById],
      references: [volunteers.id],
      relationName: "CreatedOpportunities",
    }), // Each opportunity is created by one volunteer (staff/admin)
    requiredSkills: many(opportunityRequiredSkills), // Each opportunity can require many skills
    interests: many(opportunityInterests), // Each opportunity can belong to many interest categories
    rsvps: many(volunteerRsvps), // Each opportunity can have many RSVPs
    hours: many(volunteerHours), // Each opportunity can have many volunteer hour records
  }),
);

/**
 * Opportunity-Required Skills relations - Junction table relations
 */
export const opportunityRequiredSkillsRelations = relations(
  opportunityRequiredSkills,
  ({ one }) => ({
    opportunity: one(opportunities, {
      fields: [opportunityRequiredSkills.opportunityId],
      references: [opportunities.id],
    }), // Each opportunity-skill belongs to one opportunity
    skill: one(skills, {
      fields: [opportunityRequiredSkills.skillId],
      references: [skills.id],
    }), // Each opportunity-skill belongs to one skill
  }),
);

/**
 * Opportunity-Interests relations - Junction table relations
 */
export const opportunityInterestsRelations = relations(
  opportunityInterests,
  ({ one }) => ({
    opportunity: one(opportunities, {
      fields: [opportunityInterests.opportunityId],
      references: [opportunities.id],
    }), // Each opportunity-interest belongs to one opportunity
    interest: one(interests, {
      fields: [opportunityInterests.interestId],
      references: [interests.id],
    }), // Each opportunity-interest belongs to one interest
  }),
);

/**
 * Volunteer RSVPs relations - Junction table relations
 */
export const volunteerRsvpsRelations = relations(volunteerRsvps, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [volunteerRsvps.volunteerId],
    references: [volunteers.id],
  }), // Each RSVP belongs to one volunteer
  opportunity: one(opportunities, {
    fields: [volunteerRsvps.opportunityId],
    references: [opportunities.id],
  }), // Each RSVP belongs to one opportunity
}));

/**
 * Volunteer Hours relations
 */
export const volunteerHoursRelations = relations(volunteerHours, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [volunteerHours.volunteerId],
    references: [volunteers.id],
  }), // Each hour record belongs to one volunteer
  opportunity: one(opportunities, {
    fields: [volunteerHours.opportunityId],
    references: [opportunities.id],
  }), // Each hour record belongs to one opportunity
  verifiedBy: one(volunteers, {
    fields: [volunteerHours.verifiedBy],
    references: [volunteers.id],
    relationName: "VerifiedHours",
  }), // Each hour record can be verified by one volunteer (staff/admin)
}));
