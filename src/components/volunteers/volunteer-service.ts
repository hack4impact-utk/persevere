"use client";

import { VolunteerFilters, VolunteersResponse } from "./types";

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
    volunteers: data.data.map((item: any) => ({
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
