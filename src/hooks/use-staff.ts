import { useCallback, useEffect, useRef, useState } from "react";

import type { Staff } from "@/components/staff/people-management/types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { fetchStaff } from "@/services/staff.service";

export type StaffFiltersInput = {
  role?: "admin" | "staff";
};

export type UseStaffResult = {
  // Active
  activeStaff: Staff[];
  totalActiveStaff: number;
  activePage: number;
  setActivePage: (page: number) => void;

  // Inactive
  inactiveStaff: Staff[];
  totalInactiveStaff: number;
  inactivePage: number;
  setInactivePage: (page: number) => void;

  // Pending
  pendingStaff: Staff[];
  totalPendingStaff: number;
  pendingPage: number;
  setPendingPage: (page: number) => void;

  // Shared
  limit: number;
  setLimit: (limit: number) => void;
  loading: boolean;
  isMutating: boolean;
  error: string | null;

  loadStaff: () => Promise<void>;
  createStaff: (data: Record<string, unknown>) => Promise<boolean>;
};

export function useStaff(
  searchQuery: string,
  filters: StaffFiltersInput,
): UseStaffResult {
  const [activeStaff, setActiveStaff] = useState<Staff[]>([]);
  const [totalActiveStaff, setTotalActiveStaff] = useState(0);
  const [activePage, setActivePage] = useState(1);

  const [inactiveStaff, setInactiveStaff] = useState<Staff[]>([]);
  const [totalInactiveStaff, setTotalInactiveStaff] = useState(0);
  const [inactivePage, setInactivePage] = useState(1);

  const [pendingStaff, setPendingStaff] = useState<Staff[]>([]);
  const [totalPendingStaff, setTotalPendingStaff] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);

  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler(setError);

  const loadStaffRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const loadStaff = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const [activeResponse, inactiveResponse, pendingResponse] =
        await Promise.all([
          fetchStaff({
            search: searchQuery,
            page: activePage,
            limit,
            isActive: true,
            emailVerified: true,
            role: filters.role,
          }),
          fetchStaff({
            search: searchQuery,
            page: inactivePage,
            limit,
            isActive: false,
            emailVerified: true,
            role: filters.role,
          }),
          fetchStaff({
            search: searchQuery,
            page: pendingPage,
            limit,
            emailVerified: false,
            role: filters.role,
          }),
        ]);

      setActiveStaff(activeResponse.staff ?? []);
      setTotalActiveStaff(activeResponse.total ?? 0);

      setInactiveStaff(inactiveResponse.staff ?? []);
      setTotalInactiveStaff(inactiveResponse.total ?? 0);

      setPendingStaff(pendingResponse.staff ?? []);
      setTotalPendingStaff(pendingResponse.total ?? 0);
    } catch (error_) {
      if (
        handleApiError(error_, "Failed to load staff. Please try again later.")
      )
        return;
      setActiveStaff([]);
      setTotalActiveStaff(0);
      setInactiveStaff([]);
      setTotalInactiveStaff(0);
      setPendingStaff([]);
      setTotalPendingStaff(0);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    activePage,
    inactivePage,
    pendingPage,
    limit,
    filters.role,
    handleApiError,
  ]);

  const createStaff = useCallback(
    async (data: Record<string, unknown>): Promise<boolean> => {
      setIsMutating(true);
      try {
        await apiClient.post("/api/staff/staff", data);
        void loadStaff();
        return true;
      } catch (error_) {
        if (!handleApiError(error_)) {
          console.error("[useStaff] createStaff:", error_);
        }
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [handleApiError, loadStaff],
  );

  loadStaffRef.current = loadStaff;

  useEffect(() => {
    const debounceTimer = setTimeout(
      () => {
        void loadStaffRef.current?.();
      },
      searchQuery ? 300 : 0,
    );

    return (): void => {
      clearTimeout(debounceTimer);
    };
  }, [searchQuery]);

  useEffect(() => {
    void loadStaffRef.current?.();
  }, [activePage, inactivePage, pendingPage, limit, filters.role]);

  return {
    activeStaff,
    totalActiveStaff,
    activePage,
    setActivePage,

    inactiveStaff,
    totalInactiveStaff,
    inactivePage,
    setInactivePage,

    pendingStaff,
    totalPendingStaff,
    pendingPage,
    setPendingPage,

    limit,
    setLimit,
    loading,
    isMutating,
    error,

    loadStaff,
    createStaff,
  };
}
