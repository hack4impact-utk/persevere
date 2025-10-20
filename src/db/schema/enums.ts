import { pgEnum } from "drizzle-orm/pg-core";

// User role hierarchy - admin extends staff, staff extends volunteer
export const volunteerRoleEnum = pgEnum("volunteer_role", [
  "volunteer",
  "staff",
  "admin",
]);

// Opportunity/event status tracking
export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "open",
  "full",
  "completed",
  "canceled",
]);

// RSVP response status for volunteer signups
export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "pending",
  "confirmed",
  "declined",
  "attended",
  "no_show",
]);

// Background check verification status
export const backgroundCheckStatusEnum = pgEnum("background_check_status", [
  "not_required",
  "pending",
  "approved",
  "rejected",
]);

// Skill proficiency levels for volunteer skills
export const proficiencyLevelEnum = pgEnum("proficiency_level", [
  "beginner",
  "intermediate",
  "advanced",
]);

// User notification preferences
export const notificationPreferenceEnum = pgEnum("notification_preference", [
  "email",
  "sms",
  "both",
  "none",
]);
