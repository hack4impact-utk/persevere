import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Staff } from "@/components/staff/people-management/types";
import { AuthenticationError, fetchStaff } from "@/services/staff.service";

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
  error: string | null;

  loadStaff: () => Promise<void>;
};

export function useStaff(
  searchQuery: string,
  filters: StaffFiltersInput,
): UseStaffResult {
  const router = useRouter();

  const [activeStaff, setActiveStaff] = useState<Staff[]>([]);
  const [totalActiveStaff, setTotalActiveStaff] = useState(0);
  const [activePage, setActivePage] = useState(1);

  const [inactiveStaff, setInactiveStaff] = useState<Staff[]>([]);
  const [totalInactiveStaff, setTotalInactiveStaff] = useState(0);
  const [inactivePage, setInactivePage] = useState(1);

  const [pendingStaff, setPendingStaff] = useState<Staff[]>([]);
  const [totalPendingStaff, setTotalPendingStaff] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);

  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (error_ instanceof AuthenticationError) {
        router.push("/auth/login");
        return;
      }

      console.error("Failed to fetch staff:", error_);
      setError("Failed to load staff. Please try again later.");
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
    router,
  ]);

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
    error,

    loadStaff,
  };
}
