"use client";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventIcon from "@mui/icons-material/Event";
import ListIcon from "@mui/icons-material/List";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { JSX, useMemo, useState } from "react";

import { Calendar } from "@/components/staff/calendar";
import OpportunityDetailModal from "@/components/volunteer/opportunity-detail-modal";
import type { Opportunity } from "@/components/volunteer/types";
import { formatDate, formatTime } from "@/components/volunteer/utils";
import { useOpportunities } from "@/hooks/use-opportunities";
import { RSVP_STATUS_COLORS } from "@/lib/constants";

type View = "list" | "calendar";

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
  onClick: () => void;
};

function OpportunityCard({
  opportunity,
  onClick,
}: OpportunityCardProps): JSX.Element {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 2,
        boxShadow: 2,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
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
          {opportunity.isRecurring && (
            <Chip label="↻ Recurring" size="small" variant="outlined" />
          )}
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
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default function OpportunitiesPage(): JSX.Element {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("list");
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

  const rsvpColorMap = useMemo((): Record<string, string> => {
    const map: Record<string, string> = {};
    for (const [id, status] of rsvpStatusMap) {
      map[String(id)] =
        status === "confirmed"
          ? RSVP_STATUS_COLORS.confirmed
          : RSVP_STATUS_COLORS.pending;
    }
    return map;
  }, [rsvpStatusMap]);

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
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Opportunities
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse and sign up for volunteer opportunities
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, newView: View | null) => {
            if (newView) setView(newView);
          }}
          size="small"
          aria-label="view toggle"
        >
          <ToggleButton value="list" aria-label="list view">
            <ListIcon fontSize="small" sx={{ mr: 0.5 }} />
            List
          </ToggleButton>
          <ToggleButton value="calendar" aria-label="calendar view">
            <CalendarMonthIcon fontSize="small" sx={{ mr: 0.5 }} />
            Calendar
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Search toolbar (list view only) */}
      {view === "list" && (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 2,
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
      )}

      {view === "list" && error && (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {view === "list" && rsvpWarning && (
        <Alert severity="warning" sx={{ mb: 2, flexShrink: 0 }}>
          Could not load your RSVP status — button states may be inaccurate.
        </Alert>
      )}

      {/* Body */}
      <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {view === "list" ? (
          <>
            {loading && <SkeletonGrid />}

            {!loading && opportunities.length === 0 && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <EventIcon
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
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
                    onClick={() => {
                      setSelectedOpportunityId(opp.id);
                    }}
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
          </>
        ) : (
          <Calendar
            readOnly
            onEventClick={(id) => {
              setSelectedOpportunityId(Number.parseInt(id, 10));
            }}
            eventColors={rsvpColorMap}
          />
        )}
      </Box>

      <OpportunityDetailModal
        opportunityId={selectedOpportunityId}
        isRsvped={
          selectedOpportunityId === null
            ? false
            : rsvpedIds.has(selectedOpportunityId)
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
