import { relations } from "drizzle-orm/relations";

import {
  account,
  adminDashboardActions,
  communicationLogs,
  interests,
  opportunities,
  opportunityInterests,
  opportunityRequiredSkills,
  session,
  skills,
  systemSettings,
  user,
  volunteerHours,
  volunteerInterests,
  volunteerRsvps,
  volunteers,
  volunteerSkills,
} from "./schema";

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const adminDashboardActionsRelations = relations(
  adminDashboardActions,
  ({ one }) => ({
    volunteer: one(volunteers, {
      fields: [adminDashboardActions.adminId],
      references: [volunteers.id],
    }),
  }),
);

export const volunteersRelations = relations(volunteers, ({ many }) => ({
  adminDashboardActions: many(adminDashboardActions),
  systemSettings: many(systemSettings),
  communicationLogs_senderId: many(communicationLogs, {
    relationName: "communicationLogs_senderId_volunteers_id",
  }),
  communicationLogs_recipientId: many(communicationLogs, {
    relationName: "communicationLogs_recipientId_volunteers_id",
  }),
  opportunities: many(opportunities),
  volunteerHours_volunteerId: many(volunteerHours, {
    relationName: "volunteerHours_volunteerId_volunteers_id",
  }),
  volunteerHours_verifiedBy: many(volunteerHours, {
    relationName: "volunteerHours_verifiedBy_volunteers_id",
  }),
  volunteerInterests: many(volunteerInterests),
  volunteerSkills: many(volunteerSkills),
  volunteerRsvps: many(volunteerRsvps),
}));

export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [systemSettings.updatedById],
    references: [volunteers.id],
  }),
}));

export const communicationLogsRelations = relations(
  communicationLogs,
  ({ one }) => ({
    volunteer_senderId: one(volunteers, {
      fields: [communicationLogs.senderId],
      references: [volunteers.id],
      relationName: "communicationLogs_senderId_volunteers_id",
    }),
    volunteer_recipientId: one(volunteers, {
      fields: [communicationLogs.recipientId],
      references: [volunteers.id],
      relationName: "communicationLogs_recipientId_volunteers_id",
    }),
  }),
);

export const opportunitiesRelations = relations(
  opportunities,
  ({ one, many }) => ({
    volunteer: one(volunteers, {
      fields: [opportunities.createdById],
      references: [volunteers.id],
    }),
    volunteerHours: many(volunteerHours),
    opportunityInterests: many(opportunityInterests),
    opportunityRequiredSkills: many(opportunityRequiredSkills),
    volunteerRsvps: many(volunteerRsvps),
  }),
);

export const volunteerHoursRelations = relations(volunteerHours, ({ one }) => ({
  volunteer_volunteerId: one(volunteers, {
    fields: [volunteerHours.volunteerId],
    references: [volunteers.id],
    relationName: "volunteerHours_volunteerId_volunteers_id",
  }),
  opportunity: one(opportunities, {
    fields: [volunteerHours.opportunityId],
    references: [opportunities.id],
  }),
  volunteer_verifiedBy: one(volunteers, {
    fields: [volunteerHours.verifiedBy],
    references: [volunteers.id],
    relationName: "volunteerHours_verifiedBy_volunteers_id",
  }),
}));

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

export const interestsRelations = relations(interests, ({ many }) => ({
  opportunityInterests: many(opportunityInterests),
  volunteerInterests: many(volunteerInterests),
}));

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

export const skillsRelations = relations(skills, ({ many }) => ({
  opportunityRequiredSkills: many(opportunityRequiredSkills),
  volunteerSkills: many(volunteerSkills),
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

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
