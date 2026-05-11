import { useCallback, useEffect, useState } from "react";

import type { Staff } from "@/components/staff/people-management/types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { fetchStaff } from "@/services/staff.service";
import type { Volunteer } from "@/services/volunteer-client.service";
import { fetchVolunteers } from "@/services/volunteer-client.service";

export type PersonRole = "admin" | "staff" | "volunteer";
export type PersonRoleFilter = PersonRole | "";
export type PersonStatusFilter = "active" | "inactive" | "pending" | "";

export type Person = {
  key: string;
  id: number;
  userId: number;
  personType: PersonRole;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  profilePicture?: string | null;
  totalHours?: number;
  completionPercentage?: number;
  createdAt?: Date;
};

function staffToPerson(s: Staff): Person {
  return {
    key: `staff-${s.id}`,
    id: s.id,
    userId: s.userId,
    personType: s.isAdmin ? "admin" : "staff",
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    phone: s.phone,
    isActive: s.isActive,
    isEmailVerified: s.isEmailVerified,
    profilePicture: s.profilePicture,
    createdAt: s.createdAt,
  };
}

function volunteerToPerson(v: Volunteer): Person {
  return {
    key: `volunteer-${v.id}`,
    id: v.id,
    userId: v.userId,
    personType: "volunteer",
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email,
    phone: v.phone,
    isActive: v.isActive,
    isEmailVerified: v.isEmailVerified,
    profilePicture: v.profilePicture,
    totalHours: v.totalHours,
    completionPercentage: v.completionPercentage,
    createdAt: v.createdAt,
  };
}

function statusToApiParams(status: PersonStatusFilter): {
  emailVerified?: boolean;
  isActive?: boolean;
} {
  if (status === "active") return { emailVerified: true, isActive: true };
  if (status === "inactive") return { emailVerified: true, isActive: false };
  if (status === "pending") return { emailVerified: false };
  return {};
}

const ALL_ROLES_LIMIT = 2000;

export type UsePeopleFilters = {
  roleFilter: PersonRoleFilter;
  statusFilter: PersonStatusFilter;
  typeFilter?: string;
  alumniFilter?: boolean;
};

export type UsePeopleResult = {
  people: Person[];
  total: number;
  grandTotal: number;
  totalActive: number;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  setLimit: (l: number) => void;
  loading: boolean;
  isMutating: boolean;
  error: string | null;
  loadPeople: () => Promise<void>;
  resendCredentials: (volunteerId: number) => Promise<boolean>;
  createStaff: (data: Record<string, unknown>) => Promise<{
    message?: string;
    data?: Staff;
    emailSent?: boolean;
    emailError?: boolean;
  } | null>;
};

export function usePeople(
  searchQuery: string,
  filters: UsePeopleFilters,
): UsePeopleResult {
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const loadPeople = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);
    const statusParams = statusToApiParams(filters.statusFilter);
    try {
      const { roleFilter } = filters;

      if (roleFilter === "volunteer") {
        const res = await fetchVolunteers({
          search: searchQuery,
          page,
          limit,
          type: filters.typeFilter,
          alumni: filters.alumniFilter,
          ...statusParams,
        });
        setPeople(res.volunteers.map((v) => volunteerToPerson(v)));
        setTotal(res.total);
      } else if (roleFilter === "admin" || roleFilter === "staff") {
        const res = await fetchStaff({
          search: searchQuery,
          page,
          limit,
          role: roleFilter,
          ...statusParams,
        });
        setPeople(res.staff.map((s) => staffToPerson(s)));
        setTotal(res.total);
      } else if (filters.typeFilter ?? filters.alumniFilter) {
        // Volunteer-only filters active: skip staff rows entirely
        const res = await fetchVolunteers({
          search: searchQuery,
          limit: ALL_ROLES_LIMIT,
          page: 1,
          type: filters.typeFilter,
          alumni: filters.alumniFilter,
          ...statusParams,
        });
        setPeople(res.volunteers.map((v) => volunteerToPerson(v)));
        setTotal(res.total);
      } else {
        // All roles: fetch everything (staff always small; volunteers may be large)
        const [staffRes, volunteerRes] = await Promise.all([
          fetchStaff({
            search: searchQuery,
            limit: ALL_ROLES_LIMIT,
            page: 1,
            ...statusParams,
          }),
          fetchVolunteers({
            search: searchQuery,
            limit: ALL_ROLES_LIMIT,
            page: 1,
            ...statusParams,
          }),
        ]);
        const combined = [
          ...staffRes.staff.map((s) => staffToPerson(s)),
          ...volunteerRes.volunteers.map((v) => volunteerToPerson(v)),
        ];
        setPeople(combined.slice((page - 1) * limit, page * limit));
        setTotal(staffRes.total + volunteerRes.total);
      }
    } catch (error_) {
      if (handleApiError(error_, "Failed to load people. Please try again."))
        return;
      setPeople([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    page,
    limit,
    filters.roleFilter,
    filters.statusFilter,
    filters.typeFilter,
    filters.alumniFilter,
    handleApiError,
  ]);

  usePaginatedSearch(loadPeople, searchQuery, [
    page,
    limit,
    filters.roleFilter,
    filters.statusFilter,
    filters.typeFilter,
    filters.alumniFilter,
  ]);

  // Fetch grand totals once on mount for subtitle display
  useEffect(() => {
    void (async (): Promise<void> => {
      try {
        const [staffRes, activeStaffRes, volRes, activeVolRes] =
          await Promise.all([
            fetchStaff({ page: 1, limit: 1 }),
            fetchStaff({ page: 1, limit: 1, isActive: true }),
            fetchVolunteers({ page: 1, limit: 1 }),
            fetchVolunteers({
              page: 1,
              limit: 1,
              emailVerified: true,
              isActive: true,
            }),
          ]);
        setGrandTotal(staffRes.total + volRes.total);
        setTotalActive(activeStaffRes.total + activeVolRes.total);
      } catch {
        // non-critical — subtitle counts stay 0
      }
    })();
  }, []);

  const resendCredentials = useCallback(
    async (volunteerId: number): Promise<boolean> => {
      setIsMutating(true);
      try {
        await apiClient.post(
          `/api/staff/volunteers/${volunteerId}/resend-credentials`,
        );
        return true;
      } catch (error_) {
        if (!handleApiError(error_)) {
          console.error("[usePeople] resendCredentials:", error_);
        }
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError],
  );

  const createStaff = useCallback(
    async (
      data: Record<string, unknown>,
    ): Promise<{
      message?: string;
      data?: Staff;
      emailSent?: boolean;
      emailError?: boolean;
    } | null> => {
      setIsMutating(true);
      try {
        const result = await apiClient.post<{
          message?: string;
          data?: Staff;
          emailSent?: boolean;
          emailError?: boolean;
        }>("/api/staff/staff", data);
        void loadPeople();
        return result;
      } catch (error_) {
        if (!handleApiError(error_)) {
          console.error("[usePeople] createStaff:", error_);
          throw error_;
        }
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError, loadPeople],
  );

  return {
    people,
    total,
    grandTotal,
    totalActive,
    page,
    setPage,
    limit,
    setLimit,
    loading,
    isMutating,
    error,
    loadPeople,
    resendCredentials,
    createStaff,
  };
}
