"use client";

import EventIcon from "@mui/icons-material/Event";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { JSX, useState } from "react";

import { PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/ui";
import { OpportunityCard } from "@/components/volunteer/opportunity-card";
import OpportunityDetailModal from "@/components/volunteer/opportunity-detail-modal";
import { useOpportunities } from "@/hooks/use-opportunities";
import { useRecommendations } from "@/hooks/use-recommendations";

export default function OpportunitiesPage(): JSX.Element {
  const [search, setSearch] = useState("");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<
    number | null
  >(null);

  const {
    opportunities,
    rsvpedIds,
    rsvpStatusMap,
    loading,
    error,
    rsvpWarning,
    hasMore,
    loadingMore,
    loadMore,
    handleRsvpChange,
  } = useOpportunities(search);

  const { recommendations, loading: recsLoading } = useRecommendations();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
      }}
    >
      <PageHeader
        eyebrow="Volunteer Portal"
        title="Browse Opportunities"
        subtitle="Find the perfect volunteer opportunity for you"
        actions={
          <Button
            component={NextLink}
            href="/volunteer/calendar"
            variant="outlined"
          >
            My calendar
          </Button>
        }
      />

      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flex: 1, flexWrap: "wrap" }}>
          <TextField
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search opportunities"
            sx={{ minWidth: 240, flex: 1, maxWidth: 400 }}
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
        <Typography variant="body2" color="text.secondary">
          {opportunities.length} opportunities
        </Typography>
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

      <Box sx={{ minHeight: 0 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && !search && !recsLoading && recommendations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Recommended for You
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: 2,
              }}
            >
              {recommendations.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  matchScore={opp.matchScore}
                  onClick={() => {
                    setSelectedOpportunityId(opp.id);
                  }}
                />
              ))}
            </Box>
            <Divider sx={{ mt: 3 }} />
          </Box>
        )}

        {!loading && opportunities.length === 0 && (
          <EmptyState
            icon={<EventIcon sx={{ fontSize: 64 }} />}
            message="No opportunities found"
            subMessage={
              search
                ? "Try a different search term"
                : "Check back soon for new opportunities"
            }
          />
        )}

        {!loading && opportunities.length > 0 && (
          <Box mb={2}>
            {recommendations.length > 0 && (
              <Typography variant="h6" fontWeight={700} mb={2}>
                All Opportunities
              </Typography>
            )}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: 2,
              }}
            >
              {opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onClick={() => {
                    setSelectedOpportunityId(opp.id);
                  }}
                />
              ))}
            </Box>
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

      <OpportunityDetailModal
        opportunityId={selectedOpportunityId}
        isRsvped={
          selectedOpportunityId === null
            ? false
            : rsvpedIds.has(selectedOpportunityId)
        }
        rsvpStatus={
          selectedOpportunityId === null
            ? undefined
            : rsvpStatusMap.get(selectedOpportunityId)
        }
        open={selectedOpportunityId !== null}
        onClose={() => {
          setSelectedOpportunityId(null);
        }}
        onRsvpChange={(newIsRsvped) => {
          if (selectedOpportunityId !== null) {
            handleRsvpChange(selectedOpportunityId, newIsRsvped);
          }
        }}
      />
    </Box>
  );
}
