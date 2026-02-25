import { useSnackbar } from "notistack";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  Opportunity,
  RsvpItem,
  RsvpStatus,
} from "@/components/volunteer/types";
import { apiClient } from "@/lib/api-client";

const LIMIT = 12;

export type UseOpportunitiesResult = {
  opportunities: Opportunity[];
  rsvpedIds: Set<number>;
  rsvpStatusMap: Map<number, RsvpStatus>;
  loading: boolean;
  error: string | null;
  rsvpWarning: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  loadOpportunities: () => Promise<void>;
  loadMore: () => Promise<void>;
  handleRsvpChange: (opportunityId: number, newIsRsvped: boolean) => void;
};

export function useOpportunities(search: string): UseOpportunitiesResult {
  const { enqueueSnackbar } = useSnackbar();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [rsvpedIds, setRsvpedIds] = useState<Set<number>>(new Set());
  const [rsvpStatusMap, setRsvpStatusMap] = useState<Map<number, RsvpStatus>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpWarning, setRsvpWarning] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadOpportunitiesRef = useRef<(() => Promise<void>) | undefined>(
    undefined,
  );

  const loadOpportunities = useCallback(async (): Promise<void> => {
    setError(null);
    setRsvpWarning(false);
    setLoading(true);
    setPage(0);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: "0",
        ...(search && { search }),
      });

      const [oppsResult, rsvpsResult] = await Promise.allSettled([
        apiClient.get<{ data: Opportunity[] }>(
          `/api/volunteer/opportunities?${params}`,
        ),
        apiClient.get<{ data: { all: RsvpItem[] } }>("/api/volunteer/rsvps"),
      ]);

      if (oppsResult.status === "rejected") {
        throw oppsResult.reason as Error;
      }

      setOpportunities(oppsResult.value.data);
      setHasMore(oppsResult.value.data.length === LIMIT);

      if (rsvpsResult.status === "fulfilled") {
        setRsvpedIds(
          new Set(rsvpsResult.value.data.all.map((r) => r.opportunityId)),
        );
        const statusMap = new Map<number, RsvpStatus>();
        for (const r of rsvpsResult.value.data.all) {
          statusMap.set(r.opportunityId, r.rsvpStatus);
        }
        setRsvpStatusMap(statusMap);
      } else {
        console.error(
          "[useOpportunities] RSVP status fetch failed:",
          rsvpsResult.reason,
        );
        setRsvpWarning(true);
      }
    } catch (error_) {
      console.error("[useOpportunities] Failed to load opportunities:", error_);
      setError("Failed to load opportunities. Please try again.");
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  loadOpportunitiesRef.current = loadOpportunities;

  // Debounce search (300ms), instant on mount
  useEffect(() => {
    const timer = setTimeout(
      () => {
        void loadOpportunitiesRef.current?.();
      },
      search ? 300 : 0,
    );
    return (): void => {
      clearTimeout(timer);
    };
  }, [search]);

  const handleRsvpChange = useCallback(
    (opportunityId: number, newIsRsvped: boolean): void => {
      setRsvpedIds((prev) => {
        const next = new Set(prev);
        if (newIsRsvped) {
          next.add(opportunityId);
        } else {
          next.delete(opportunityId);
        }
        return next;
      });
      setRsvpStatusMap((prev) => {
        const m = new Map(prev);
        if (newIsRsvped) {
          m.set(opportunityId, "pending");
        } else {
          m.delete(opportunityId);
        }
        return m;
      });
      setOpportunities((prev) =>
        prev.map((opp) => {
          if (opp.id !== opportunityId) return opp;
          const delta = newIsRsvped ? 1 : -1;
          const newRsvpCount = Math.max(0, opp.rsvpCount + delta);
          return {
            ...opp,
            rsvpCount: newRsvpCount,
            spotsRemaining:
              opp.maxVolunteers === null
                ? null
                : opp.maxVolunteers - newRsvpCount,
          };
        }),
      );
    },
    [],
  );

  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(nextPage * LIMIT),
      ...(search && { search }),
    });
    try {
      const json = await apiClient.get<{ data: Opportunity[] }>(
        `/api/volunteer/opportunities?${params}`,
      );
      setOpportunities((prev) => [...prev, ...json.data]);
      setPage(nextPage);
      setHasMore(json.data.length === LIMIT);
    } catch (error_) {
      console.error("[useOpportunities] loadMore failed:", error_);
      enqueueSnackbar("Failed to load more opportunities", {
        variant: "error",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, search, enqueueSnackbar]);

  return {
    opportunities,
    rsvpedIds,
    rsvpStatusMap,
    loading,
    error,
    rsvpWarning,
    hasMore,
    loadingMore,
    loadOpportunities,
    loadMore,
    handleRsvpChange,
  };
}
