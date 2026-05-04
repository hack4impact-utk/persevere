"use client";

import EventIcon from "@mui/icons-material/Event";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { JSX, useState } from "react";

import { FilterDrawer, PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/ui";
import { OpportunityCard } from "@/components/volunteer/opportunity-card";
import OpportunityDetailModal from "@/components/volunteer/opportunity-detail-modal";
import { useOpportunities } from "@/hooks/use-opportunities";
import { useOpportunityCategories } from "@/hooks/use-opportunity-categories";
import { useOpportunityLocations } from "@/hooks/use-opportunity-locations";

export default function OpportunitiesPage(): JSX.Element {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateRange, setDateRange] = useState<"week" | "month" | "">("");
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
  } = useOpportunities({ search, categoryId, locationFilter, dateRange });

  const { categories } = useOpportunityCategories();
  const { locations } = useOpportunityLocations();

  const activeFilterCount =
    (categoryId === "" ? 0 : 1) +
    (locationFilter === "" ? 0 : 1) +
    (dateRange === "" ? 0 : 1);

  const clearFilters = (): void => {
    setCategoryId("");
    setLocationFilter("");
    setDateRange("");
  };

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
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flex: 1,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search opportunities"
            sx={{ minWidth: { xs: "100%", sm: 240 }, flex: 1, maxWidth: 400 }}
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
          <FilterDrawer
            activeFilterCount={activeFilterCount}
            onClear={clearFilters}
          >
            <TextField
              select
              size="small"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(
                  e.target.value === "" ? "" : Number(e.target.value),
                );
              }}
              label="Category"
              sx={{ minWidth: 180 }}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
              }}
              label="Location"
              sx={{ minWidth: 160 }}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">Any location</MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as "week" | "month" | "");
              }}
              label="Date"
              sx={{ minWidth: 150 }}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">Any date</MenuItem>
              <MenuItem value="week">This week</MenuItem>
              <MenuItem value="month">This month</MenuItem>
            </TextField>
          </FilterDrawer>
        </Box>
        {loading ? (
          <Skeleton variant="text" width={110} height={20} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {opportunities.length} opportunities
          </Typography>
        )}
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

        {!loading && opportunities.length === 0 && (
          <EmptyState
            icon={<EventIcon sx={{ fontSize: 64 }} />}
            message="No opportunities found"
            subMessage={
              search || categoryId || locationFilter || dateRange
                ? "Try adjusting your filters"
                : "Check back soon for new opportunities"
            }
          />
        )}

        {!loading && opportunities.length > 0 && (
          <Box mb={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(auto-fill, minmax(320px, 1fr))",
                },
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
