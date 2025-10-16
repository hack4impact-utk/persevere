import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Database Enums for Volunteer Management System
 *
 * This file defines all PostgreSQL enums used throughout the database schema.
 * Enums provide type safety and data consistency across the application.
 *
 * When adding new enum values:
 * 1. Add the value to the array
 * 2. Update the corresponding TypeScript types
 * 3. Create a database migration
 * 4. Update any related business logic
 */

/**
 * User role hierarchy for access control
 *
 * Role permissions:
 * - admin: Full system access, can manage all users and settings
 * - staff: Can manage volunteers and opportunities, limited admin access
 * - volunteer: Basic user access, can manage own profile and RSVPs
 *
 * Note: Specific volunteer types (mentor, speaker, flexible) are stored
 * in the volunteerType field rather than as separate roles for simplicity.
 */
export const volunteerRoleEnum = pgEnum("volunteer_role", [
  "volunteer",
  "staff",
  "admin",
]);

/**
 * Opportunity lifecycle status
 *
 * Workflow: open → full → completed
 *           open → canceled (if cancelled before completion)
 *
 * Business rules:
 * - Only 'open' opportunities accept new RSVPs
 * - 'full' status is automatically set when maxVolunteers is reached
 * - 'completed' is set manually after the event ends
 * - 'canceled' can be set at any time before completion
 */
export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "open",
  "full",
  "completed",
  "canceled",
]);

/**
 * Volunteer RSVP workflow status
 *
 * Typical flow: pending → confirmed → attended
 * Alternative flows: pending → declined
 *                    confirmed → no_show
 *
 * Status meanings:
 * - pending: Volunteer submitted RSVP, awaiting staff approval
 * - confirmed: Staff approved the RSVP, volunteer is expected to attend
 * - declined: Volunteer declined or staff rejected the RSVP
 * - attended: Volunteer actually attended the opportunity
 * - no_show: Volunteer was confirmed but didn't show up
 */
export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "pending",
  "confirmed",
  "declined",
  "attended",
  "no_show",
]);

/**
 * Background check status for volunteer safety compliance
 *
 * Required for volunteers who interact with minors or vulnerable populations.
 * This is a legal/compliance requirement, not just a preference.
 *
 * Workflow: not_required → pending → approved/rejected
 *
 * Business rules:
 * - Some opportunities may require background checks
 * - Volunteers with 'rejected' status cannot participate in youth programs
 * - 'pending' volunteers may have limited access until approved
 */
export const backgroundCheckStatusEnum = pgEnum("background_check_status", [
  "not_required",
  "pending",
  "approved",
  "rejected",
]);

/**
 * Skill proficiency levels for volunteer-opportunity matching
 *
 * Used in the matching algorithm to pair volunteers with appropriate opportunities.
 * Higher proficiency levels may be required for certain roles or responsibilities.
 *
 * Matching logic:
 * - Opportunities can specify minimum proficiency requirements
 * - Volunteers self-assess their skill levels
 * - System can suggest matches based on skill alignment
 */
export const proficiencyLevelEnum = pgEnum("proficiency_level", [
  "beginner",
  "intermediate",
  "advanced",
]);

/**
 * Communication preferences for volunteer notifications
 *
 * Controls how volunteers receive system notifications about:
 * - New opportunities matching their interests
 * - RSVP confirmations and reminders
 * - Schedule changes or cancellations
 * - System announcements
 *
 * Implementation notes:
 * - 'none' should still allow critical system messages
 * - Consider GDPR compliance for communication preferences
 * - SMS may have additional costs/restrictions
 */
export const notificationPreferenceEnum = pgEnum("notification_preference", [
  "email",
  "sms",
  "both",
  "none",
]);
