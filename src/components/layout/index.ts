/**
 * Layout Components
 *
 * Shared layout infrastructure: sidebars, headers, and layout wrappers.
 * These components provide consistent navigation and structure across role-specific routes.
 */

export { default as AdminSidebar } from "./admin-sidebar";
export { default as BaseSidebar, type NavItem } from "./base-sidebar";
export { default as RoleLayout } from "./role-layout";
export { default as StaffSidebar } from "./staff-sidebar";
export { default as UserHeader } from "./user-header";
export { default as VolunteerSidebar } from "./volunteer-sidebar";
