import {
  type StaffFilters,
  type StaffResponse,
} from "@/components/staff/people-management/types";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export { AuthenticationError } from "@/lib/api-client";

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

  const data = await apiClient.get<{
    data: APIStaffResponse[];
    total: number;
  }>(`/api/staff/staff?${searchParams.toString()}`);

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
    limit: filters.limit || DEFAULT_PAGE_SIZE,
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
  const data = await apiClient.get<{ data: FetchStaffByIdResult }>(
    `/api/staff/staff/${id}`,
  );
  return data.data;
}
