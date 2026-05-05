"use client";

import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { enqueueSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useMemo, useState } from "react";

import { FilterDrawer, PageHeader, ResponsiveTable } from "@/components/shared";
import EventDetailModal from "@/components/staff/calendar/event-detail-modal";
import EventFormModal from "@/components/staff/calendar/event-form-modal";
import { EmptyState } from "@/components/ui";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { useEventCategories } from "@/hooks/use-event-categories";
import { usePortalLabel } from "@/hooks/use-portal-label";

type TabKey = "upcoming" | "past" | "all";

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StaffOpportunitiesPage(): JSX.Element {
  const portalLabel = usePortalLabel();
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { events, loading, fetchEvents } = useCalendarEvents();
  const { activeCategories } = useEventCategories();

  const loadEvents = useCallback(async (): Promise<void> => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      await fetchEvents(start, end);
    } catch {
      enqueueSnackbar("Failed to load events", { variant: "error" });
    }
  }, [fetchEvents]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const now = useMemo(() => new Date().toISOString(), []);

  const locations = useMemo(() => {
    const locs = new Set<string>();
    for (const e of events) {
      if (e.location) locs.add(e.location);
    }
    return [...locs].sort();
  }, [events]);

  const upcomingCount = useMemo(
    () => events.filter((e) => e.start >= now).length,
    [events, now],
  );
  const pastCount = useMemo(
    () => events.filter((e) => e.start < now).length,
    [events, now],
  );

  const filtered = useMemo(() => {
    const tabFiltered = events.filter((e) => {
      if (activeTab === "upcoming") return e.start >= now;
      if (activeTab === "past") return e.start < now;
      return true;
    });
    return tabFiltered.filter((e) => {
      const matchesSearch =
        !search || e.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !categoryId || e.extendedProps?.categoryId === categoryId;
      const matchesLocation = !locationFilter || e.location === locationFilter;
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [events, activeTab, now, search, categoryId, locationFilter]);

  const activeFilterCount =
    (categoryId === "" ? 0 : 1) + (locationFilter === "" ? 0 : 1);

  const clearFilters = (): void => {
    setCategoryId("");
    setLocationFilter("");
  };

  const selectedEvent = useMemo(
    () =>
      selectedEventId
        ? (events.find((e) => e.id === selectedEventId) ?? null)
        : null,
    [events, selectedEventId],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 1, md: 1.5 } }}>
        <PageHeader
          eyebrow={portalLabel}
          title="Opportunities"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              New Opportunity
            </Button>
          }
        >
          <Tabs
            value={activeTab}
            onChange={(_, v: TabKey) => {
              setActiveTab(v);
            }}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              label={`Upcoming (${upcomingCount})`}
              value="upcoming"
              sx={{ textTransform: "none", fontWeight: 500 }}
            />
            <Tab
              label={`Past (${pastCount})`}
              value="past"
              sx={{ textTransform: "none", fontWeight: 500 }}
            />
            <Tab
              label="All"
              value="all"
              sx={{ textTransform: "none", fontWeight: 500 }}
            />
          </Tabs>
        </PageHeader>
      </Box>

      <Box
        sx={{
          px: { xs: 2, md: 4 },
          pb: 2,
          display: "flex",
          gap: 2,
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
          <FilterDrawer
            activeFilterCount={activeFilterCount}
            onClear={clearFilters}
          >
            <TextField
              select
              size="small"
              label="Category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(
                  e.target.value === "" ? "" : Number(e.target.value),
                );
              }}
              sx={{ minWidth: 180 }}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">All categories</MenuItem>
              {activeCategories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Location"
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
              }}
              sx={{ minWidth: 160 }}
              slotProps={{ select: { displayEmpty: true } }}
            >
              <MenuItem value="">All locations</MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </TextField>
          </FilterDrawer>
        </Box>
        {!loading && (
          <Typography variant="body2" color="text.secondary">
            {filtered.length}{" "}
            {filtered.length === 1 ? "opportunity" : "opportunities"}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          px: { xs: 2, md: 4 },
          pb: 4,
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<EventIcon sx={{ fontSize: 64 }} />}
            message="No opportunities found"
            subMessage={
              search || categoryId || locationFilter
                ? "Try adjusting your filters"
                : activeTab === "past"
                  ? "No past events in the last 6 months"
                  : "Check back soon or create a new event"
            }
          />
        ) : (
          <Card
            elevation={0}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <ResponsiveTable
              desktop={
                <TableContainer sx={{ position: "relative" }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell
                          sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                        >
                          Title
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                        >
                          Category
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                        >
                          Date
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                        >
                          RSVPs
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((event) => {
                        const { maxVolunteers, rsvpCount, categoryName } =
                          event.extendedProps ?? {};
                        const filled = rsvpCount ?? 0;
                        const pct = maxVolunteers ? filled / maxVolunteers : 0;
                        const isNearFull = pct > 0.9;

                        return (
                          <TableRow
                            key={event.id}
                            hover
                            onClick={() => {
                              setSelectedEventId(event.id);
                            }}
                            sx={{ cursor: "pointer" }}
                          >
                            <TableCell>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color="text.primary"
                              >
                                {event.title}
                              </Typography>
                              {event.location && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    mt: 0.25,
                                  }}
                                >
                                  <LocationOnIcon
                                    sx={{
                                      fontSize: 12,
                                      color: "text.secondary",
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {event.location}
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              {categoryName ? (
                                <Chip
                                  label={categoryName}
                                  size="small"
                                  variant="outlined"
                                />
                              ) : (
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatDate(event.start)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {maxVolunteers == null ? (
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  No limit
                                </Typography>
                              ) : (
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                    alignItems: "flex-end",
                                    minWidth: 72,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    sx={{
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {filled} / {maxVolunteers}
                                  </Typography>
                                  <Box
                                    sx={{
                                      height: 4,
                                      width: 72,
                                      bgcolor: "action.hover",
                                      borderRadius: 2,
                                      mt: 0.5,
                                      overflow: "hidden",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: `${pct * 100}%`,
                                        height: "100%",
                                        bgcolor: isNearFull
                                          ? "warning.main"
                                          : "primary.main",
                                        borderRadius: 2,
                                        transition: "width 0.3s",
                                      }}
                                    />
                                  </Box>
                                </Box>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              }
              mobile={
                <Stack spacing={1} sx={{ p: 1 }}>
                  {filtered.map((event) => {
                    const { maxVolunteers, rsvpCount, categoryName } =
                      event.extendedProps ?? {};
                    const filled = rsvpCount ?? 0;
                    const pct = maxVolunteers ? filled / maxVolunteers : 0;
                    const isNearFull = pct > 0.9;

                    return (
                      <Card
                        key={event.id}
                        variant="outlined"
                        onClick={() => {
                          setSelectedEventId(event.id);
                        }}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Box sx={{ p: 1.5 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="text.primary"
                          >
                            {event.title}
                          </Typography>
                          {event.location && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                mt: 0.25,
                              }}
                            >
                              <LocationOnIcon
                                sx={{ fontSize: 12, color: "text.secondary" }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {event.location}
                              </Typography>
                            </Box>
                          )}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDate(event.start)}
                            </Typography>
                            {categoryName && (
                              <Chip
                                label={categoryName}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {maxVolunteers == null ? (
                              <Typography
                                variant="caption"
                                color="text.disabled"
                              >
                                No limit
                              </Typography>
                            ) : (
                              <Chip
                                label={`${filled} / ${maxVolunteers} RSVPs`}
                                size="small"
                                color={isNearFull ? "warning" : "default"}
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              }
            />
          </Card>
        )}
      </Box>

      <EventDetailModal
        event={selectedEvent}
        eventId={selectedEventId}
        open={!!selectedEventId}
        onClose={() => {
          setSelectedEventId(null);
        }}
        onUpdated={() => {
          void loadEvents();
        }}
        onDeleted={() => {
          void loadEvents();
        }}
      />

      <EventFormModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
        }}
        onCreated={() => {
          setCreateOpen(false);
          void loadEvents();
        }}
      />
    </Box>
  );
}
