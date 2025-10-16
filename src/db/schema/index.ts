// src/db/schema/index.ts

/**
 * Database Schema Exports
 *
 * This file exports all database schema components for the volunteer
 * management system. Each module contains related tables and functionality.
 *
 * Schema modules:
 * - enums: Database enums and type definitions
 * - users: User management, authentication, and volunteer profiles
 * - opportunities: Events, RSVPs, and volunteer hours tracking
 * - communications: Messaging, notifications, and templates
 * - admin: Administrative functions and system management
 *
 * Usage:
 * Import specific tables or use wildcard imports for convenience.
 * All tables are properly typed with Drizzle ORM.
 */

export * from "./admin";
export * from "./communications";
export * from "./enums";
export * from "./opportunities";
export * from "./users";
