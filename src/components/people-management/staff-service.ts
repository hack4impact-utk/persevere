import { type StaffFilters, type StaffResponse } from "./types";

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

type APIStaffResponse = {
  staff: {
    id: number;
    userId: number;
    notificationPreference: string;
    createdAt: Date;
    updatedAt: Date;
  };
  users: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    isEmailVerified: boolean;
    profilePicture: string | null;
    createdAt: Date;
  };
  isAdmin: boolean;
};

/**
 * Fetches a paginated list of staff members with optional search and filtering.
 */
export async function fetchStaff(
  filters: StaffFilters = {},
): Promise<StaffResponse> {
  const searchParams = new URLSearchParams();

  if (filters.search) searchParams.append("search", filters.search);
  if (filters.isActive !== undefined)
    searchParams.append("isActive", String(filters.isActive));
  if (filters.emailVerified !== undefined)
    searchParams.append("emailVerified", String(filters.emailVerified));
  if (filters.role) searchParams.append("role", filters.role);
  if (filters.page) searchParams.append("page", String(filters.page));
  if (filters.limit) searchParams.append("limit", String(filters.limit));

  const response = await fetch(`/api/staff/staff?${searchParams.toString()}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError("Unauthorized access");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch staff");
  }

  const data = await response.json();

  return {
    staff: data.data.map((item: APIStaffResponse) => ({
      id: item.staff.id,
      userId: item.users.id,
      firstName: item.users.firstName,
      lastName: item.users.lastName,
      email: item.users.email,
      phone: item.users.phone || undefined,
      isActive: item.users.isActive,
      isEmailVerified: item.users.isEmailVerified,
      isAdmin: item.isAdmin,
      profilePicture: item.users.profilePicture,
      createdAt: item.users.createdAt,
    })),
    total: data.total,
    page: filters.page || 1,
    limit: filters.limit || 10,
  };
}

/**
 * Return type for fetchStaffById function.
 */
export type FetchStaffByIdResult = {
  staff: {
    id: number;
    userId: number;
    notificationPreference: string;
    createdAt: Date;
    updatedAt: Date;
  };
  users: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    profilePicture?: string | null;
    emailVerifiedAt?: Date | null;
  } | null;
  isAdmin: boolean;
};

/**
 * Fetches complete staff member profile data by ID.
 */
export async function fetchStaffById(
  id: number,
): Promise<FetchStaffByIdResult> {
  const response = await fetch(`/api/staff/staff/${id}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch staff member");
  }

  const data = await response.json();
  return data.data;
}
