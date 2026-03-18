/**
 * Pagination constants used across API routes and client-side hooks.
 */
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * Default page number for paginated requests.
 */
export const DEFAULT_PAGE = 1;

export const RECENT_OPPORTUNITIES_LIMIT = 5;
export const RECOMMENDED_OPPORTUNITIES_LIMIT = 3;
export const VOLUNTEER_MATCHES_LIMIT = 5;
export const ALL_OPPORTUNITIES_CEILING = 200;
export const RSVP_STATUS_COLORS = {
  confirmed: "#4caf50",
  pending: "#ff9800",
  default: "#9e9e9e",
} as const;
