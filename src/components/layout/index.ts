/**
 * Layout Components
 *
 * Shared layout infrastructure: sidebars and layout wrappers.
 * These components provide consistent navigation and structure across role-specific routes.
 */

export { default as BaseSidebar, type NavItem } from "./base-sidebar";
export { default as RoleLayout } from "./role-layout";
export { default as StaffSidebar } from "./staff-sidebar";
export { default as VolunteerSidebar } from "./volunteer-sidebar";
