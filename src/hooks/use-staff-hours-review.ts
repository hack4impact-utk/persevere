import { useCallback, useEffect, useRef, useState } from "react";

import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export type HoursWithVolunteer = {
  id: number;
  volunteerId: number;
  opportunityId: number;
  opportunityTitle: string | null;
  volunteerName: string;
  date: string;
  hours: number;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  verifiedBy: number | null;
  verifiedAt: string | null;
};

export type HoursReviewFilters = {
  page: number;
  limit: number;
  status?: "pending" | "verified" | "all";
  search?: string;
};

export function useStaffHoursReview(): {
  hours: HoursWithVolunteer[];
  loading: boolean;
  isMutating: boolean;
  error: string | null;
  total: number;
  page: number;
  loadHours: (filters: HoursReviewFilters) => void;
  approveHours: (id: number) => Promise<boolean>;
  rejectHours: (id: number, reason?: string) => Promise<boolean>;
  deleteHours: (id: number) => Promise<boolean>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setStatus: (status: "pending" | "verified" | "all") => void;
  setSearch: (search: string) => void;
  limit: number;
  status: "pending" | "verified" | "all";
  search: string;
} {
  const [hours, setHours] = useState<HoursWithVolunteer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<"pending" | "verified" | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const loadHours = useCallback(
    async (currentFilters: HoursReviewFilters): Promise<void> => {
      setError(null);
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentFilters.page),
          limit: String(currentFilters.limit),
        });

        if (currentFilters.status && currentFilters.status !== "all") {
          params.set("status", currentFilters.status);
        }

        if (currentFilters.search) {
          params.set("search", currentFilters.search);
        }

        const response = await apiClient.get<{
          data: HoursWithVolunteer[];
          total: number;
        }>(`/api/staff/hours?${params.toString()}`);

        setHours(response.data ?? []);
        setTotal(response.total ?? 0);
      } catch (error_) {
        if (
          handleApiError(
            error_,
            "Failed to load hours. Please try again later.",
          )
        )
          return;
        setHours([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  const loadHoursRef = useRef(loadHours);
  loadHoursRef.current = loadHours;

  const filtersRef = useRef({ page, limit, status, search: debouncedSearch });
  filtersRef.current = { page, limit, status, search: debouncedSearch };

  const approveHours = useCallback(
    async (id: number): Promise<boolean> => {
      setIsMutating(true);
      setError(null);
      try {
        await apiClient.put(`/api/staff/hours/${id}`, { action: "approve" });
        void loadHoursRef.current(filtersRef.current);
        return true;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to approve hours")) {
          console.error("[useStaffHoursReview] approveHours:", error_);
        }
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError],
  );

  const rejectHours = useCallback(
    async (id: number, reason?: string): Promise<boolean> => {
      setIsMutating(true);
      setError(null);
      try {
        await apiClient.put(`/api/staff/hours/${id}`, {
          action: "reject",
          reason,
        });
        void loadHoursRef.current(filtersRef.current);
        return true;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to reject hours")) {
          console.error("[useStaffHoursReview] rejectHours:", error_);
        }
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError],
  );

  const deleteHours = useCallback(
    async (id: number): Promise<boolean> => {
      setIsMutating(true);
      setError(null);
      try {
        await apiClient.delete(`/api/staff/hours/${id}`);
        void loadHoursRef.current(filtersRef.current);
        return true;
      } catch (error_) {
        if (!handleApiError(error_, "Failed to delete hours")) {
          console.error("[useStaffHoursReview] deleteHours:", error_);
        }
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError],
  );

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setDebouncedSearch(search);
        setPage(1);
      },
      search ? 300 : 0,
    );
    return (): void => {
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    void loadHoursRef.current({ page, limit, status, search: debouncedSearch });
  }, [page, limit, status, debouncedSearch]);

  return {
    hours,
    loading,
    isMutating,
    error,
    total,
    page,
    loadHours: (currentFilters: HoursReviewFilters): void => {
      setPage(currentFilters.page);
      setLimit(currentFilters.limit);
      if (currentFilters.status) setStatus(currentFilters.status);
      if (currentFilters.search !== undefined) setSearch(currentFilters.search);
    },
    approveHours,
    rejectHours,
    deleteHours,
    setPage,
    setLimit,
    setStatus,
    setSearch,
    limit,
    status,
    search,
  };
}
