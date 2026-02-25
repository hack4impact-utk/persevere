"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { JSX, useEffect, useState } from "react";

import RsvpButton from "@/components/volunteer/rsvp-button";
import type { Opportunity } from "@/components/volunteer/types";
import { formatDate, formatTime } from "@/components/volunteer/utils";
import { useAttendees } from "@/hooks/use-attendees";
import { useOpportunity } from "@/hooks/use-opportunity";

type Props = {
  opportunityId: number | null;
  isRsvped: boolean;
  open: boolean;
  onClose: () => void;
  onRsvpChange: (newIsRsvped: boolean) => void;
};

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

export default function OpportunityDetailModal({
  opportunityId,
  isRsvped,
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)" },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1.25rem",
          pr: 6,
        }}
      >
        {loading ? "Loading..." : (opportunity?.title ?? "Opportunity")}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {opportunity && !loading && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SpotsChip opp={opportunity} />
              {opportunity.maxVolunteers !== null && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <PeopleIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {opportunity.rsvpCount} / {opportunity.maxVolunteers}{" "}
                    volunteers
                  </Typography>
                </Box>
              )}
            </Box>

            {opportunity.description && (
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {opportunity.description}
              </Typography>
            )}

            <Divider />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <CalendarTodayIcon
                  sx={{ fontSize: 16, color: "text.secondary" }}
                />
                <Typography variant="body2">
                  {formatDate(opportunity.startDate)} &middot;{" "}
                  {formatTime(opportunity.startDate)}
                  {opportunity.endDate && (
                    <> &ndash; {formatTime(opportunity.endDate)}</>
                  )}
                </Typography>
              </Box>

              {opportunity.location && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <LocationOnIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                  <Typography variant="body2">
                    {opportunity.location}
                  </Typography>
                </Box>
              )}
            </Box>

            {(opportunity.requiredSkills.length > 0 ||
              opportunity.requiredInterests.length > 0) && (
              <>
                <Divider />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {opportunity.requiredSkills.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: "uppercase" }}
                      >
                        Required Skills
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        {opportunity.requiredSkills.map((s) => (
                          <Chip
                            key={s.skillId}
                            label={s.skillName ?? "Unknown"}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  {opportunity.requiredInterests.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: "uppercase" }}
                      >
                        Related Interests
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
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
                </Box>
              </>
            )}

            {attendees.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      <PeopleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      {attendees.length}{" "}
                      {attendees.length === 1 ? "person" : "people"} attending
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        setAttendeesExpanded((prev) => !prev);
                      }}
                      sx={{ textTransform: "none", minWidth: 0 }}
                    >
                      {attendeesExpanded ? "Hide" : "Show names"}
                    </Button>
                  </Box>
                  <Collapse in={attendeesExpanded}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {attendees.map((a) => a.firstName).join(", ")}
                    </Typography>
                  </Collapse>
                </Box>
              </>
            )}

            <Box sx={{ pt: 1 }}>
              {opportunityId !== null && (
                <RsvpButton
                  opportunityId={opportunityId}
                  isRsvped={isRsvped}
                  isFull={isFull}
                  onRsvpChange={onRsvpChange}
                />
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
