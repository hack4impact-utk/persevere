import { useSnackbar } from "notistack";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Opportunity, RsvpItem } from "@/components/volunteer/types";

const LIMIT = 12;

export type UseOpportunitiesResult = {
  opportunities: Opportunity[];
  rsvpedIds: Set<number>;
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

      const [oppsRes, rsvpsRes] = await Promise.all([
        fetch(`/api/volunteer/opportunities?${params}`),
        fetch("/api/volunteer/rsvps"),
      ]);

      if (!oppsRes.ok) {
        throw new Error(`Failed to load opportunities (${oppsRes.status})`);
      }

      const oppsJson = (await oppsRes.json()) as { data: Opportunity[] };
      setOpportunities(oppsJson.data);
      setHasMore(oppsJson.data.length === LIMIT);

      if (rsvpsRes.ok) {
        const rsvpsJson = (await rsvpsRes.json()) as {
          data: { all: RsvpItem[] };
        };
        setRsvpedIds(new Set(rsvpsJson.data.all.map((r) => r.opportunityId)));
      } else {
        console.error(
          "[useOpportunities] RSVP status fetch failed:",
          rsvpsRes.status,
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
      const res = await fetch(`/api/volunteer/opportunities?${params}`);
      if (!res.ok) throw new Error(`Failed to load more (${res.status})`);
      const json = (await res.json()) as { data: Opportunity[] };
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
