import { pgEnum } from "drizzle-orm/pg-core";

/**
 * MVP ENUMS FOR VOLUNTEER MANAGEMENT SYSTEM
 *
 * These enums support the core volunteer management functionality
 * as defined in the Persevere PRD v2 MVP requirements.
 */

/**
 * Volunteer role types as specified in PRD
 * - mentor: Tech mentor role
 * - guest_speaker: Guest speaker role
 * - flexible: Flexible "drop-in" volunteer role
 * - staff: Staff member with admin access
 * - admin: Administrator with full access
 */
export const volunteerRoleEnum = pgEnum("volunteer_role", [
  "mentor",
  "guest_speaker",
  "flexible",
  "staff",
  "admin",
]);

/**
 * Opportunity status for event/engagement calendar
 * - open: Accepting RSVPs/signups
 * - full: Reached capacity
 * - completed: Event finished
 * - canceled: Event canceled
 */
export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "open",
  "full",
  "completed",
  "canceled",
]);

/**
 * RSVP/Signup status for volunteers
 * - pending: RSVP submitted, awaiting confirmation
 * - confirmed: RSVP approved and confirmed
 * - declined: RSVP declined or rejected
 * - attended: Volunteer attended the opportunity
 * - no_show: Confirmed but didn't show up
 */
export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "pending",
  "confirmed",
  "declined",
  "attended",
  "no_show",
]);

/**
 * Background check status for youth interaction
 * - not_required: No background check needed
 * - pending: Background check in progress
 * - approved: Background check approved
 * - rejected: Background check rejected
 */
export const backgroundCheckStatusEnum = pgEnum("background_check_status", [
  "not_required",
  "pending",
  "approved",
  "rejected",
]);

/**
 * Skill proficiency levels for volunteer matching
 * - beginner: Basic knowledge/experience
 * - intermediate: Moderate knowledge/experience
 * - advanced: Expert level knowledge/experience
 */
export const proficiencyLevelEnum = pgEnum("proficiency_level", [
  "beginner",
  "intermediate",
  "advanced",
]);

/**
 * Notification preferences for volunteer communication
 * - email: Email notifications only
 * - sms: SMS notifications only
 * - both: Both email and SMS
 * - none: No notifications
 */
export const notificationPreferenceEnum = pgEnum("notification_preference", [
  "email",
  "sms",
  "both",
  "none",
]);
