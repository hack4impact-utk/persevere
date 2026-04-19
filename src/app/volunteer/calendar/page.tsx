"use client";

import Box from "@mui/material/Box";
import { JSX, useEffect, useMemo, useState } from "react";

import { Calendar } from "@/components/staff/calendar";
import OpportunityDetailModal from "@/components/volunteer/opportunity-detail-modal";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { useOpportunities } from "@/hooks/use-opportunities";
import { RSVP_STATUS_COLORS } from "@/lib/constants";

export default function VolunteerCalendarPage(): JSX.Element {
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<
    number | null
  >(null);

  const { events: calendarEvents, fetchEvents } = useCalendarEvents();

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    void fetchEvents(start, end);
  }, [fetchEvents]);

  const { rsvpedIds, rsvpStatusMap, handleRsvpChange } = useOpportunities("");

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
        height: "100%",
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: { xs: 2, md: 4 },
      }}
    >
      <Calendar
        readOnly
        events={calendarEvents}
        onEventClick={(id) => {
          setSelectedOpportunityId(Number.parseInt(id, 10));
        }}
        eventColors={rsvpColorMap}
      />

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
