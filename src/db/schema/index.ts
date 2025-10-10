// src/db/schema/index.ts

/**
 * MVP SCHEMA EXPORTS
 *
 * This file exports all schema components for the Persevere
 * volunteer management system MVP as defined in PRD v2.
 *
 * Core MVP schemas:
 * - enums: All enum definitions for the system
 * - users: Volunteer management, skills, and interests
 * - opportunities: Event/engagement calendar and RSVP management
 * - communications: Volunteer communication tools
 * - admin: Admin dashboard and system management
 */

export * from "./admin";
export * from "./communications";
export * from "./enums";
export * from "./opportunities";
export * from "./users";
