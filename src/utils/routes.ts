/**
 * Route Utilities
 *
 * Centralized route mapping functions for role-based navigation.
 */

/**
 * Returns the dashboard route for a given user role.
 */
export function getDashboardRoute(role: string | undefined): string {
  switch (role) {
    case "admin": {
      return "/admin/dashboard";
    }
    case "staff": {
      return "/staff/dashboard";
    }
    case "volunteer": {
      return "/volunteer/dashboard";
    }
    default: {
      return "/auth/login";
    }
  }
}

/**
 * Returns the profile route for a given user role.
 */
export function getProfileRoute(role: string | undefined): string {
  switch (role) {
    case "admin": {
      return "/admin/profile";
    }
    case "staff": {
      return "/staff/profile";
    }
    case "volunteer": {
      return "/volunteer/profile";
    }
    default: {
      return "/auth/login";
    }
  }
}
