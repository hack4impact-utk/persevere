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
 * Opportunities and Events Management Schema
 *
 * This file contains tables for managing volunteer opportunities, events,
 * RSVPs, and volunteer hours tracking.
 *
 * Key features:
 * - Event and opportunity management
 * - RSVP and signup functionality
 * - Volunteer hours tracking and verification
 * - Skills and interests matching
 * - Recurring event support
 *
 * Related files:
 * - users.ts: Volunteer profiles and skills
 * - communications.ts: Event-related messaging
 * - admin.ts: Administrative oversight
 */

/**
 * Volunteer opportunities and events
 *
 * Central table for all volunteer opportunities, events, and engagements.
 * Supports both one-time and recurring events with flexible scheduling.
 *
 * Event lifecycle:
 * 1. Created by staff/admin
 * 2. Volunteers RSVP
 * 3. Event occurs
 * 4. Hours are tracked and verified
 * 5. Event marked as completed
 */
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Event title
  description: text("description").notNull(), // Detailed event description
  location: text("location").notNull(), // Event location
  startDate: timestamp("start_date").notNull(), // Event start time
  endDate: timestamp("end_date").notNull(), // Event end time
  status: opportunityStatusEnum("status").default("open").notNull(), // Current status
  maxVolunteers: integer("max_volunteers"), // Volunteer capacity (null = unlimited)
  createdById: integer("created_by_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "restrict" }), // Staff/admin who created this
  recurrencePattern: jsonb("recurrence_pattern"), // Recurrence rules (weekly, monthly, etc.)
  isRecurring: boolean("is_recurring").default(false).notNull(), // Recurring event flag
  createdAt: timestamp("created_at").defaultNow().notNull(), // Creation timestamp
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Last update timestamp
});

/**
 * Skills and Interests Matching
 *
 * These tables link opportunities to required skills and interests,
 * enabling the matching engine to suggest appropriate volunteers.
 */

/**
 * Required skills for opportunities
 *
 * Links opportunities to the skills they require from volunteers.
 * Used by the matching algorithm to find qualified volunteers.
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
 * RSVP and Signup Management
 *
 * Tracks volunteer responses to opportunities and manages the signup process.
 * Includes status tracking and approval workflows.
 */

/**
 * Volunteer RSVPs and signups
 *
 * Records when volunteers respond to opportunities and tracks their status
 * through the approval and attendance process.
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
 * Volunteer Hours Tracking
 *
 * Records actual volunteer hours worked for reporting, recognition, and analytics.
 * Supports both self-reported and verified hour tracking.
 */

/**
 * Volunteer hours worked
 *
 * Tracks actual hours worked by volunteers for each opportunity.
 * Used for grant reporting, volunteer recognition, and analytics.
 */
export const volunteerHours = pgTable("volunteer_hours", {
  id: serial("id").primaryKey(),
  volunteerId: integer("volunteer_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "cascade" }), // Volunteer who worked the hours
  opportunityId: integer("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }), // Opportunity where hours were worked
  date: timestamp("date").notNull(), // Date hours were worked
  hours: real("hours").notNull(), // Hours worked (supports decimals like 2.5)
  notes: text("notes"), // Additional notes about the session
  verifiedBy: integer("verified_by").references(() => volunteers.id, {
    onDelete: "set null",
  }), // Staff/admin who verified the hours
  verifiedAt: timestamp("verified_at"), // Verification timestamp
});

/**
 * Database Relations
 *
 * Defines relationships between opportunity tables and other entities for querying.
 * Enables efficient joins and nested data fetching.
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
