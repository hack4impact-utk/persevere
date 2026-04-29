import { useCallback, useEffect, useState } from "react";

import type { Volunteer } from "@/components/staff/volunteer-management/types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { fetchVolunteers } from "@/services/volunteer-client.service";

export type VolunteerStatusFilter = "active" | "inactive" | "pending";

export type VolunteerFiltersInput = {
  type?: string;
  alumni?: boolean;
  status?: VolunteerStatusFilter;
};

function statusToApiParams(status?: VolunteerStatusFilter): {
  emailVerified?: boolean;
  isActive?: boolean;
} {
  if (status === "active") return { emailVerified: true, isActive: true };
  if (status === "inactive") return { emailVerified: true, isActive: false };
  if (status === "pending") return { emailVerified: false };
  return {};
}

export type UseVolunteersResult = {
  volunteers: Volunteer[];
  total: number;
  grandTotal: number;
  totalActive: number;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  loading: boolean;
  isMutating: boolean;
  error: string | null;
  loadVolunteers: () => Promise<void>;
  resendCredentials: (volunteerId: number) => Promise<boolean>;
  updateBackgroundStatus: (
    volunteerId: number,
    status: "not_required" | "pending" | "approved",
  ) => Promise<boolean>;
  createVolunteer: (data: Record<string, unknown>) => Promise<{
    message?: string;
    data?: Volunteer;
    emailSent?: boolean;
    emailError?: boolean;
    backgroundCheckStatus?: string;
  } | null>;
  deleteVolunteer: (volunteerId: number) => Promise<boolean>;
};

export function useVolunteers(
  searchQuery: string,
  filters: VolunteerFiltersInput,
  { skip = false }: { skip?: boolean } = {},
): UseVolunteersResult {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const loadVolunteers = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const apiParams = statusToApiParams(filters.status);
      const response = await fetchVolunteers({
        search: searchQuery,
        page,
        limit,
        type: filters.type,
        alumni: filters.alumni,
        ...apiParams,
      });
      setVolunteers(response.volunteers ?? []);
      setTotal(response.total ?? 0);
    } catch (error_) {
      if (
        handleApiError(
          error_,
          "Failed to load volunteers. Please try again later.",
        )
      )
        return;
      setVolunteers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    page,
    limit,
    filters.type,
    filters.alumni,
    filters.status,
    handleApiError,
  ]);

  usePaginatedSearch(
    loadVolunteers,
    searchQuery,
    [page, limit, filters.type, filters.alumni, filters.status],
    skip,
  );

  // Fetch grand total and active count once on mount (for subtitle)
  useEffect(() => {
    if (skip) return;
    void (async (): Promise<void> => {
      try {
        const [allRes, activeRes] = await Promise.all([
          fetchVolunteers({ limit: 1, page: 1 }),
          fetchVolunteers({
            limit: 1,
            page: 1,
            emailVerified: true,
            isActive: true,
          }),
        ]);
        setGrandTotal(allRes.total);
        setTotalActive(activeRes.total);
      } catch {
        // Non-critical — subtitle counts can remain 0
      }
    })();
  }, [skip]);

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
          console.error("[useVolunteers] resendCredentials:", error_);
        }
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError],
  );

  const updateBackgroundStatus = useCallback(
    async (
      volunteerId: number,
      status: "not_required" | "pending" | "approved",
    ): Promise<boolean> => {
      setIsMutating(true);
      try {
        await apiClient.put(`/api/staff/volunteers/${volunteerId}`, {
          backgroundCheckStatus: status,
        });
        return true;
      } catch (error_) {
        if (!handleApiError(error_)) {
          console.error("[useVolunteers] updateBackgroundStatus:", error_);
        }
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError],
  );

  const createVolunteer = useCallback(
    async (
      data: Record<string, unknown>,
    ): Promise<{
      message?: string;
      data?: Volunteer;
      emailSent?: boolean;
      emailError?: boolean;
      backgroundCheckStatus?: string;
    } | null> => {
      setIsMutating(true);
      try {
        const result = await apiClient.post<{
          message?: string;
          data?: Volunteer;
          emailSent?: boolean;
          emailError?: boolean;
          backgroundCheckStatus?: string;
        }>("/api/staff/volunteers", data);
        void loadVolunteers();
        return result;
      } catch (error_) {
        if (!handleApiError(error_)) {
          console.error("[useVolunteers] createVolunteer:", error_);
          throw error_;
        }
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError, loadVolunteers],
  );

  const deleteVolunteer = useCallback(
    async (volunteerId: number): Promise<boolean> => {
      setIsMutating(true);
      try {
        await apiClient.delete(`/api/staff/volunteers/${volunteerId}`);
        void loadVolunteers();
        return true;
      } catch (error_) {
        if (!handleApiError(error_)) {
          console.error("[useVolunteers] deleteVolunteer:", error_);
        }
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError, loadVolunteers],
  );

  return {
    volunteers,
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
    loadVolunteers,
    resendCredentials,
    updateBackgroundStatus,
    createVolunteer,
    deleteVolunteer,
  };
}
