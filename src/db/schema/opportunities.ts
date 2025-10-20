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

import { opportunityStatusEnum, rsvpStatusEnum } from "./enums";
import { interests, skills, users, volunteers } from "./users";

// Volunteer opportunities/events - main events volunteers can sign up for
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: opportunityStatusEnum("status").default("open").notNull(),
  maxVolunteers: integer("max_volunteers"),
  createdById: integer("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  recurrencePattern: jsonb("recurrence_pattern"),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Many-to-many: opportunities and their required skills
export const opportunityRequiredSkills = pgTable(
  "opportunity_required_skills",
  {
    opportunityId: integer("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.opportunityId, table.skillId] }),
  }),
);

// Many-to-many: opportunities and their related interests
export const opportunityInterests = pgTable(
  "opportunity_interests",
  {
    opportunityId: integer("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    interestId: integer("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.opportunityId, table.interestId] }),
  }),
);

// Volunteer RSVPs - tracks volunteer signups for opportunities
export const volunteerRsvps = pgTable(
  "volunteer_rsvps",
  {
    volunteerId: integer("volunteer_id")
      .notNull()
      .references(() => volunteers.id, { onDelete: "cascade" }),
    opportunityId: integer("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    status: rsvpStatusEnum("status").default("pending").notNull(),
    rsvpAt: timestamp("rsvp_at").defaultNow().notNull(),
    notes: text("notes"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.volunteerId, table.opportunityId] }),
  }),
);

// Volunteer hours tracking - records actual hours worked and verification
export const volunteerHours = pgTable("volunteer_hours", {
  id: serial("id").primaryKey(),
  volunteerId: integer("volunteer_id")
    .notNull()
    .references(() => volunteers.id, { onDelete: "cascade" }),
  opportunityId: integer("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  hours: real("hours").notNull(),
  notes: text("notes"),
  verifiedBy: integer("verified_by").references(() => users.id, {
    onDelete: "set null",
  }),
  verifiedAt: timestamp("verified_at"),
});

// Table relationships
export const opportunitiesRelations = relations(
  opportunities,
  ({ one, many }) => ({
    createdBy: one(users, {
      fields: [opportunities.createdById],
      references: [users.id],
      relationName: "CreatedOpportunities",
    }),
    requiredSkills: many(opportunityRequiredSkills),
    interests: many(opportunityInterests),
    rsvps: many(volunteerRsvps),
    hours: many(volunteerHours),
  }),
);

export const opportunityRequiredSkillsRelations = relations(
  opportunityRequiredSkills,
  ({ one }) => ({
    opportunity: one(opportunities, {
      fields: [opportunityRequiredSkills.opportunityId],
      references: [opportunities.id],
    }),
    skill: one(skills, {
      fields: [opportunityRequiredSkills.skillId],
      references: [skills.id],
    }),
  }),
);

export const opportunityInterestsRelations = relations(
  opportunityInterests,
  ({ one }) => ({
    opportunity: one(opportunities, {
      fields: [opportunityInterests.opportunityId],
      references: [opportunities.id],
    }),
    interest: one(interests, {
      fields: [opportunityInterests.interestId],
      references: [interests.id],
    }),
  }),
);

export const volunteerRsvpsRelations = relations(volunteerRsvps, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [volunteerRsvps.volunteerId],
    references: [volunteers.id],
  }),
  opportunity: one(opportunities, {
    fields: [volunteerRsvps.opportunityId],
    references: [opportunities.id],
  }),
}));

export const volunteerHoursRelations = relations(volunteerHours, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [volunteerHours.volunteerId],
    references: [volunteers.id],
  }),
  opportunity: one(opportunities, {
    fields: [volunteerHours.opportunityId],
    references: [opportunities.id],
  }),
  verifiedBy: one(users, {
    fields: [volunteerHours.verifiedBy],
    references: [users.id],
    relationName: "VerifiedHours",
  }),
}));
