import { type VolunteerFilters, type VolunteersResponse } from "./types";

type APIVolunteerResponse = {
  volunteers: {
    id: number;
    userId: number;
    volunteerType: string | null;
  };
  users: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };
};

/**
 * Fetches a paginated list of volunteers with optional search and filtering.
 */
export async function fetchVolunteers(
  filters: VolunteerFilters = {},
): Promise<VolunteersResponse> {
  const searchParams = new URLSearchParams();

  if (filters.search) searchParams.append("search", filters.search);
  if (filters.type) searchParams.append("type", filters.type);
  if (filters.alumni !== undefined)
    searchParams.append("alumni", String(filters.alumni));
  if (filters.page) searchParams.append("page", String(filters.page));
  if (filters.limit) searchParams.append("limit", String(filters.limit));

  const response = await fetch(
    `/api/staff/volunteers?${searchParams.toString()}`,
    {
      cache: "no-store",
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch volunteers");
  }

  const data = await response.json();

  return {
    volunteers: data.data.map((item: APIVolunteerResponse) => ({
      id: item.volunteers.id,
      userId: item.volunteers.userId,
      firstName: item.users.firstName,
      lastName: item.users.lastName,
      email: item.users.email,
      phone: item.users.phone,
      volunteerType: item.volunteers.volunteerType,
      isActive: item.users.isActive,
    })),
    total: data.total,
    page: filters.page || 1,
    limit: filters.limit || 10,
  };
}

/**
 * Return type for fetchVolunteerById function.
 */
export type FetchVolunteerByIdResult = {
  volunteers: {
    id: number;
    userId: number;
    volunteerType: string | null;
    isAlumni: boolean;
    backgroundCheckStatus: "not_required" | "pending" | "approved" | "rejected";
    mediaRelease: boolean;
    availability: unknown;
    notificationPreference: "email" | "sms" | "both" | "none";
    createdAt: Date;
    updatedAt: Date;
  };
  users: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    bio: string | null;
    isActive: boolean;
  } | null;
};

/**
 * Fetches complete volunteer profile data by ID, including user information
 * and volunteer-specific details (status, availability, etc.).
 */
export async function fetchVolunteerById(
  id: number,
): Promise<FetchVolunteerByIdResult> {
  const response = await fetch(`/api/staff/volunteers/${id}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch volunteer");
  }

  const data = await response.json();
  return data.data;
}
