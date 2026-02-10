"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useRef, useState } from "react";

import RsvpButton from "@/components/volunteer/rsvp-button";
import type { Opportunity, RsvpItem } from "@/components/volunteer/types";
import { formatDate, formatTime } from "@/components/volunteer/utils";

const LIMIT = 12;

function SpotsChip({ opp }: { opp: Opportunity }): JSX.Element {
  if (opp.spotsRemaining === null) {
    return <Chip label="Open enrollment" color="success" size="small" />;
  }
  if (opp.spotsRemaining <= 0) {
    return <Chip label="Full" color="default" size="small" />;
  }
  if (opp.spotsRemaining <= 3) {
    return (
      <Chip
        label={`${opp.spotsRemaining} spot${opp.spotsRemaining === 1 ? "" : "s"} left`}
        color="warning"
        size="small"
      />
    );
  }
  return (
    <Chip
      label={`${opp.spotsRemaining} spots left`}
      color="success"
      size="small"
    />
  );
}

type OpportunityCardProps = {
  opportunity: Opportunity;
  isRsvped: boolean;
  onRsvpChange: (newIsRsvped: boolean) => void;
};

function OpportunityCard({
  opportunity,
  isRsvped,
  onRsvpChange,
}: OpportunityCardProps): JSX.Element {
  const isFull =
    !isRsvped &&
    opportunity.spotsRemaining !== null &&
    opportunity.spotsRemaining <= 0;

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: 2,
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
      }}
    >
      <CardContent sx={{ p: 2.5, flex: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={1}
          mb={1}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              flex: 1,
              minWidth: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {opportunity.title}
          </Typography>
          <SpotsChip opp={opportunity} />
        </Box>

        {opportunity.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            mb={1.5}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {opportunity.description}
          </Typography>
        )}

        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            {formatDate(opportunity.startDate)} &middot;{" "}
            {formatTime(opportunity.startDate)}
          </Typography>
        </Box>

        {opportunity.location && (
          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
            <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ minWidth: 0 }}
            >
              {opportunity.location}
            </Typography>
          </Box>
        )}

        {opportunity.maxVolunteers !== null && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <PeopleIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {opportunity.rsvpCount} / {opportunity.maxVolunteers} volunteers
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ px: 2.5, pb: 2, pt: 0 }}>
        <RsvpButton
          opportunityId={opportunity.id}
          isRsvped={isRsvped}
          isFull={isFull}
          onRsvpChange={onRsvpChange}
        />
      </CardActions>
    </Card>
  );
}

function SkeletonGrid(): JSX.Element {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
        },
        gap: 3,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Skeleton variant="text" width="70%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="80%" sx={{ mb: 1.5 }} />
            <Skeleton variant="text" width="55%" />
            <Skeleton variant="text" width="50%" sx={{ mb: 2 }} />
            <Skeleton
              variant="rectangular"
              height={36}
              sx={{ borderRadius: 1 }}
            />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default function OpportunitiesPage(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [rsvpedIds, setRsvpedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpWarning, setRsvpWarning] = useState(false);
  const [search, setSearch] = useState("");
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
          "[OpportunitiesPage] RSVP status fetch failed:",
          rsvpsRes.status,
        );
        setRsvpWarning(true);
      }
    } catch (error_) {
      console.error(
        "[OpportunitiesPage] Failed to load opportunities:",
        error_,
      );
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
      console.error("[OpportunitiesPage] loadMore failed:", error_);
      enqueueSnackbar("Failed to load more opportunities", {
        variant: "error",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, search, enqueueSnackbar]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        p: 3,
        overflow: "hidden",
      }}
    >
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Opportunities
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Browse and sign up for volunteer opportunities
      </Typography>

      {/* Search toolbar */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          flexShrink: 0,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          label="Search opportunities"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          placeholder="Search by title, description, or location..."
          sx={{ flex: 1, minWidth: 240 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {rsvpWarning && (
        <Alert severity="warning" sx={{ mb: 2, flexShrink: 0 }}>
          Could not load your RSVP status — button states may be inaccurate.
        </Alert>
      )}

      {/* Scrollable content area */}
      <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {loading && <SkeletonGrid />}

        {!loading && opportunities.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <EventIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No opportunities found
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {search
                ? "Try a different search term"
                : "Check back soon for new opportunities"}
            </Typography>
          </Box>
        )}

        {opportunities.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                isRsvped={rsvpedIds.has(opp.id)}
                onRsvpChange={(newIsRsvped) =>
                  handleRsvpChange(opp.id, newIsRsvped)
                }
              />
            ))}
          </Box>
        )}

        {hasMore && !loading && (
          <Box sx={{ textAlign: "center", mt: 4, mb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                void loadMore();
              }}
              disabled={loadingMore}
              startIcon={
                loadingMore ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              {loadingMore ? "Loading..." : "Load More"}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
