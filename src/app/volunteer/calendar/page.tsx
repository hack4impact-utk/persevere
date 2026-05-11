"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import NextLink from "next/link";
import { JSX, useMemo, useState } from "react";

import { PageHeader } from "@/components/shared";
import { Calendar } from "@/components/staff/calendar";
import OpportunityDetailModal from "@/components/volunteer/opportunity-detail-modal";
import UpcomingSessions from "@/components/volunteer/upcoming-sessions";
import type { CalendarEvent } from "@/hooks/use-calendar-events";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useOpportunities } from "@/hooks/use-opportunities";
import { RSVP_STATUS_COLORS } from "@/lib/constants";

export default function VolunteerCalendarPage(): JSX.Element {
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<
    number | null
  >(null);
  const isMobile = useIsMobile();

  const {
    rsvpedIds,
    rsvpStatusMap,
    rsvpItems,
    loading,
    handleRsvpChange,
    loadOpportunities,
  } = useOpportunities({ search: "" });

  // Derive calendar events from the volunteer's own RSVPs — no date-range window.
  // This ensures all RSVPd events (past and future) appear and stay in sync.
  const calendarEvents = useMemo(
    (): CalendarEvent[] =>
      rsvpItems
        .filter(
          (r) =>
            r.opportunityStatus !== "canceled" &&
            r.opportunityStartDate !== null &&
            r.opportunityEndDate !== null,
        )
        .map((r) => ({
          id: String(r.opportunityId),
          title: r.opportunityTitle ?? "",
          location: r.opportunityLocation ?? undefined,
          start: r.opportunityStartDate!,
          end: r.opportunityEndDate!,
          extendedProps: { status: r.opportunityStatus ?? "open" },
        })),
    [rsvpItems],
  );

  const rsvpColorMap = useMemo((): Record<string, string> => {
    const map: Record<string, string> = {};
    for (const [id, status] of rsvpStatusMap) {
      map[String(id)] =
        status === "confirmed"
          ? RSVP_STATUS_COLORS.confirmed
          : status === "pending"
            ? RSVP_STATUS_COLORS.pending
            : RSVP_STATUS_COLORS.default;
    }
    return map;
  }, [rsvpStatusMap]);

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
        title="My Calendar"
        subtitle="View all upcoming events and sessions."
        actions={
          <Button
            component={NextLink}
            href="/volunteer/opportunities"
            variant="contained"
          >
            Browse opportunities
          </Button>
        }
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" },
          gap: "20px",
          flex: 1,
          minHeight: 0,
          alignItems: "start",
        }}
      >
        <Box>
          {loading ? (
            <Card elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Skeleton variant="rectangular" height={500} />
            </Card>
          ) : (
            <Calendar
              readOnly
              compact
              initialView={isMobile ? "timeGridDay" : "dayGridMonth"}
              events={calendarEvents}
              onEventClick={(id) => {
                setSelectedOpportunityId(Number.parseInt(id, 10));
              }}
              eventColors={rsvpColorMap}
            />
          )}
        </Box>

        <UpcomingSessions rsvpItems={rsvpItems} loading={loading} />
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
            void loadOpportunities();
          }
        }}
      />
    </Box>
  );
}
