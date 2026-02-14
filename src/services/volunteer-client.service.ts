import { AuthenticationError } from "@/lib/api-client";

export { AuthenticationError } from "@/lib/api-client";

export type Volunteer = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  volunteerType?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  backgroundCheckStatus?:
    | "not_required"
    | "pending"
    | "approved"
    | "rejected"
    | null;
  isAlumni?: boolean;
  totalHours?: number;
  profilePicture?: string | null;
};

export type VolunteersResponse = {
  volunteers: Volunteer[];
  total: number;
  page: number;
  limit: number;
};

export type VolunteerFilters = {
  search?: string;
  type?: string;
  alumni?: boolean;
  page?: number;
  limit?: number;
  emailVerified?: boolean;
  isActive?: boolean;
};

type APIVolunteerResponse = {
  volunteers: {
    id: number;
    userId: number;
    volunteerType: string | null;
    backgroundCheckStatus:
      | "not_required"
      | "pending"
      | "approved"
      | "rejected"
      | null;
    isAlumni: boolean;
  };
  users: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    isEmailVerified: boolean;
    profilePicture: string | null;
  };
  totalHours?: number;
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
  if (filters.emailVerified !== undefined)
    searchParams.append("emailVerified", String(filters.emailVerified));
  if (filters.isActive !== undefined)
    searchParams.append("isActive", String(filters.isActive));
  if (filters.page) searchParams.append("page", String(filters.page));
  if (filters.limit) searchParams.append("limit", String(filters.limit));

  const response = await fetch(
    `/api/staff/volunteers?${searchParams.toString()}`,
    {
      cache: "no-store",
      next: { revalidate: 0 },
    },
  );

  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError("Unauthorized access");
  }

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
      isEmailVerified: item.users.isEmailVerified,
      backgroundCheckStatus: item.volunteers.backgroundCheckStatus,
      isAlumni: item.volunteers.isAlumni,
      totalHours: item.totalHours || 0,
      profilePicture: item.users.profilePicture,
    })),
    total: data.total,
    page: filters.page || 1,
    limit: filters.limit || 10,
  };
}

/**
 * Fetches pending invites - volunteers who have not yet verified their email.
 */
export async function fetchPendingInvites(
  filters: VolunteerFilters = {},
): Promise<VolunteersResponse> {
  return fetchVolunteers({ ...filters, emailVerified: false });
}

/**
 * Fetches active volunteers - volunteers who have verified their email and are active.
 */
export async function fetchActiveVolunteers(
  filters: VolunteerFilters = {},
): Promise<VolunteersResponse> {
  return fetchVolunteers({ ...filters, emailVerified: true, isActive: true });
}

/**
 * Fetches inactive volunteers - volunteers who have the inactive status (excluding pending invites).
 */
export async function fetchInactiveVolunteers(
  filters: VolunteerFilters = {},
): Promise<VolunteersResponse> {
  return fetchVolunteers({ ...filters, isActive: false, emailVerified: true });
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
    profilePicture?: string | null;
    emailVerifiedAt?: Date | null;
  } | null;
  totalHours?: number;
  skills?: {
    skillId: number;
    skillName: string | null;
    skillDescription: string | null;
    skillCategory: string | null;
    proficiencyLevel: "beginner" | "intermediate" | "advanced";
  }[];
  interests?: {
    interestId: number;
    interestName: string | null;
    interestDescription: string | null;
  }[];
  recentOpportunities?: {
    opportunityId: number;
    opportunityTitle: string | null;
    opportunityLocation: string | null;
    opportunityStartDate: Date | null;
    opportunityEndDate: Date | null;
    rsvpStatus: "pending" | "confirmed" | "declined" | "attended" | "no_show";
    rsvpAt: Date;
    rsvpNotes: string | null;
  }[];
  hoursBreakdown?: {
    id: number;
    opportunityId: number;
    opportunityTitle: string | null;
    date: Date;
    hours: number;
    notes: string | null;
    verifiedAt: Date | null;
  }[];
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
