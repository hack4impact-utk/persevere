import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Volunteer } from "@/components/volunteer-management/types";
import {
  AuthenticationError,
  fetchActiveVolunteers,
  fetchInactiveVolunteers,
  fetchPendingInvites,
} from "@/services/volunteer-client.service";

export type VolunteerFiltersInput = {
  type?: string;
  alumni?: boolean;
};

export type UseVolunteersResult = {
  // Active
  activeVolunteers: Volunteer[];
  totalActiveVolunteers: number;
  activePage: number;
  setActivePage: (page: number) => void;

  // Inactive
  inactiveVolunteers: Volunteer[];
  totalInactiveVolunteers: number;
  inactivePage: number;
  setInactivePage: (page: number) => void;

  // Pending
  pendingInvites: Volunteer[];
  totalPendingInvites: number;
  pendingPage: number;
  setPendingPage: (page: number) => void;

  // Shared
  limit: number;
  setLimit: (limit: number) => void;
  loading: boolean;
  error: string | null;

  loadVolunteers: () => Promise<void>;
};

export function useVolunteers(
  searchQuery: string,
  filters: VolunteerFiltersInput,
): UseVolunteersResult {
  const router = useRouter();

  // Active volunteers state
  const [activeVolunteers, setActiveVolunteers] = useState<Volunteer[]>([]);
  const [totalActiveVolunteers, setTotalActiveVolunteers] = useState(0);
  const [activePage, setActivePage] = useState(1);

  // Inactive volunteers state
  const [inactiveVolunteers, setInactiveVolunteers] = useState<Volunteer[]>([]);
  const [totalInactiveVolunteers, setTotalInactiveVolunteers] = useState(0);
  const [inactivePage, setInactivePage] = useState(1);

  // Pending invites state
  const [pendingInvites, setPendingInvites] = useState<Volunteer[]>([]);
  const [totalPendingInvites, setTotalPendingInvites] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);

  // Shared state
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to store latest loadVolunteers to avoid dependency issues
  const loadVolunteersRef = useRef<(() => Promise<void>) | undefined>(
    undefined,
  );

  const loadVolunteers = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const [activeResponse, inactiveResponse, pendingResponse] =
        await Promise.all([
          fetchActiveVolunteers({
            search: searchQuery,
            page: activePage,
            limit,
            type: filters.type,
            alumni: filters.alumni,
          }),
          fetchInactiveVolunteers({
            search: searchQuery,
            page: inactivePage,
            limit,
            type: filters.type,
            alumni: filters.alumni,
          }),
          fetchPendingInvites({
            search: searchQuery,
            page: pendingPage,
            limit,
            type: filters.type,
            alumni: filters.alumni,
          }),
        ]);

      setActiveVolunteers(activeResponse.volunteers ?? []);
      setTotalActiveVolunteers(activeResponse.total ?? 0);

      setInactiveVolunteers(inactiveResponse.volunteers ?? []);
      setTotalInactiveVolunteers(inactiveResponse.total ?? 0);

      setPendingInvites(pendingResponse.volunteers ?? []);
      setTotalPendingInvites(pendingResponse.total ?? 0);
    } catch (error_) {
      if (error_ instanceof AuthenticationError) {
        router.push("/auth/login");
        return;
      }

      console.error("Failed to fetch volunteers:", error_);
      setError("Failed to load volunteers. Please try again later.");
      setActiveVolunteers([]);
      setTotalActiveVolunteers(0);
      setInactiveVolunteers([]);
      setTotalInactiveVolunteers(0);
      setPendingInvites([]);
      setTotalPendingInvites(0);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    activePage,
    inactivePage,
    pendingPage,
    limit,
    filters.type,
    filters.alumni,
    router,
  ]);

  // Keep ref updated with latest loadVolunteers
  loadVolunteersRef.current = loadVolunteers;

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const debounceTimer = setTimeout(
      () => {
        void loadVolunteersRef.current?.();
      },
      searchQuery ? 300 : 0,
    );

    return (): void => {
      clearTimeout(debounceTimer);
    };
  }, [searchQuery]);

  // Load immediately when pagination, limit, or filters change (no debounce)
  useEffect(() => {
    void loadVolunteersRef.current?.();
  }, [
    activePage,
    inactivePage,
    pendingPage,
    limit,
    filters.type,
    filters.alumni,
  ]);

  return {
    activeVolunteers,
    totalActiveVolunteers,
    activePage,
    setActivePage,

    inactiveVolunteers,
    totalInactiveVolunteers,
    inactivePage,
    setInactivePage,

    pendingInvites,
    totalPendingInvites,
    pendingPage,
    setPendingPage,

    limit,
    setLimit,
    loading,
    error,

    loadVolunteers,
  };
}
