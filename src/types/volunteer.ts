/**
 * Volunteer Types
 *
 * Type definitions for volunteer-related data structures.
 */

/**
 * Availability data structure.
 * Represents time slots or availability periods as a flexible JSON object.
 * Example: { "monday": ["9am-12pm"], "tuesday": ["2pm-5pm"] }
 */
export type Availability = Record<string, string[] | string | boolean | number>;
