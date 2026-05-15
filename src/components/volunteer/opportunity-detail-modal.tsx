"use client";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import { JSX, useEffect, useState } from "react";

import { AsyncContent, MobileDialog, ModalTitleBar } from "@/components/shared";
import RsvpButton from "@/components/volunteer/rsvp-button";
import { SpotsChip } from "@/components/volunteer/spots-chip";
import type { RsvpStatus } from "@/components/volunteer/types";
import { useAttendees } from "@/hooks/use-attendees";
import { useOpportunity } from "@/hooks/use-opportunity";

type Props = {
  opportunityId: number | null;
  isRsvped: boolean;
  rsvpStatus?: RsvpStatus;
  open: boolean;
  onClose: () => void;
  onRsvpChange: (newIsRsvped: boolean) => void;
};

// Helpers for the date block
function getMonthShort(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", { month: "short" });
}
function getDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString().padStart(2, "0");
}
function getTimeShort(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
function getDuration(startStr: string, endStr: string | null): string | null {
  if (!endStr) return null;
  const mins = Math.round(
    (new Date(endStr).getTime() - new Date(startStr).getTime()) / 60_000,
  );
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr${h === 1 ? "" : "s"}`;
  return `${h} hr${h === 1 ? "" : "s"} ${m} min`;
}

export default function OpportunityDetailModal({
  opportunityId,
  isRsvped,
  rsvpStatus,
  open,
  onClose,
  onRsvpChange,
}: Props): JSX.Element {
  const { opportunity, loading, error } = useOpportunity(
    open ? opportunityId : null,
  );
  const { attendees } = useAttendees(open ? opportunityId : null);
  const [attendeesExpanded, setAttendeesExpanded] = useState(false);

  useEffect(() => {
    setAttendeesExpanded(false);
  }, [opportunityId]);

  const isFull =
    !isRsvped &&
    opportunity !== null &&
    opportunity.spotsRemaining !== null &&
    opportunity.spotsRemaining <= 0;

  return (
    <MobileDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <ModalTitleBar
        title={loading ? "Loading..." : (opportunity?.title ?? "Opportunity")}
        onClose={onClose}
      />

      <DialogContent
        dividers
        sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}
      >
        <AsyncContent loading={loading} error={error}>
          {opportunity && (
            <>
              {/* Header block with Date box and info */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  pb: 3,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                {opportunity.startDate && (
                  <Box
                    sx={{
                      width: 84,
                      height: 84,
                      bgcolor: "#f2f6ff",
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#27427f",
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: "primary.main",
                        textTransform: "uppercase",
                      }}
                    >
                      {getMonthShort(opportunity.startDate)}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, lineHeight: 1, my: 0.5 }}
                    >
                      {getDay(opportunity.startDate)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {getTimeShort(opportunity.startDate)}
                    </Typography>
                  </Box>
                )}
                <Box flex={1}>
                  <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                    {opportunity.categoryName && (
                      <Chip
                        label={opportunity.categoryName}
                        color="default"
                        size="small"
                      />
                    )}
                    <SpotsChip opp={opportunity} />
                  </Box>
                  {opportunity.location && (
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      color="text.primary"
                    >
                      <LocationOnIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                      <Typography variant="body2">
                        {opportunity.location}
                        {getDuration(opportunity.startDate, opportunity.endDate)
                          ? ` · ${getDuration(opportunity.startDate, opportunity.endDate)}`
                          : ""}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* About section */}
              {opportunity.description && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      mb: 1,
                      display: "block",
                    }}
                  >
                    About this opportunity
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ lineHeight: 1.6, color: "text.primary" }}
                  >
                    {opportunity.description}
                  </Typography>
                </Box>
              )}

              {/* Skills section */}
              {(opportunity.requiredSkills.length > 0 ||
                opportunity.requiredInterests.length > 0) && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      mb: 1,
                      display: "block",
                    }}
                  >
                    Skills & Interests helpful
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {opportunity.requiredSkills.map((s) => (
                      <Chip
                        key={s.skillId}
                        label={s.skillName ?? "Unknown"}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {opportunity.requiredInterests.map((i) => (
                      <Chip
                        key={i.interestId}
                        label={i.interestName ?? "Unknown"}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Attendees section */}
              {attendees.length > 0 && (
                <Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Who's attending
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setAttendeesExpanded(!attendeesExpanded)}
                    >
                      {attendeesExpanded ? "Hide names" : "Show names"}
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {attendees.length} volunteer
                    {attendees.length === 1 ? "" : "s"} RSVP'd
                  </Typography>
                  <Collapse in={attendeesExpanded} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {attendees.map((a) => a.firstName).join(", ")}
                    </Typography>
                  </Collapse>
                </Box>
              )}
            </>
          )}
        </AsyncContent>
      </DialogContent>

      {!loading && opportunity !== null && (
        <DialogActions
          sx={{
            position: { xs: "sticky", sm: "static" },
            bottom: 0,
            bgcolor: "background.paper",
            borderTop: { xs: 1, sm: 0 },
            borderColor: "divider",
          }}
        >
          <Button onClick={onClose}>Close</Button>
          {opportunity?.status === "completed" ? (
            <Button variant="outlined" disabled fullWidth>
              Event ended
            </Button>
          ) : (
            <RsvpButton
              opportunityId={opportunity.id}
              isRsvped={isRsvped}
              isFull={isFull}
              rsvpStatus={rsvpStatus}
              onRsvpChange={onRsvpChange}
            />
          )}
        </DialogActions>
      )}
    </MobileDialog>
  );
}
