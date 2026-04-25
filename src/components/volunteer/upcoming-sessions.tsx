"use client";

import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import { EmptyState } from "@/components/ui";
import type { RsvpItem } from "@/components/volunteer/types";

type UpcomingSessionsProps = {
  rsvpItems: RsvpItem[];
};

function formatSessionDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusChipProps(status: string): {
  label: string;
  color: "success" | "warning" | "default";
} {
  if (status === "confirmed") return { label: "Confirmed", color: "success" };
  if (status === "pending") return { label: "Pending", color: "warning" };
  return { label: "Waitlist", color: "default" };
}

export default function UpcomingSessions({
  rsvpItems,
}: UpcomingSessionsProps): JSX.Element {
  const now = new Date();

  const upcoming = rsvpItems
    .filter(
      (r) =>
        r.rsvpStatus !== "cancelled" &&
        r.opportunityStatus !== "canceled" &&
        r.opportunityStartDate !== null &&
        new Date(r.opportunityStartDate) > now,
    )
    .sort(
      (a, b) =>
        new Date(a.opportunityStartDate!).getTime() -
        new Date(b.opportunityStartDate!).getTime(),
    );

  return (
    <Card
      elevation={1}
      sx={{
        p: "18px",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        alignSelf: "start",
        position: { lg: "sticky" },
        top: { lg: 24 },
      }}
    >
      <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 1.5 }}>
        Your upcoming sessions
      </Typography>

      {upcoming.length === 0 ? (
        <EmptyState
          message="No upcoming sessions"
          subMessage="Sign up for opportunities to see them here."
        />
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {upcoming.map((item, i) => {
            const chip = statusChipProps(item.rsvpStatus);
            return (
              <Box
                key={item.opportunityId}
                sx={{
                  pt: i === 0 ? 0 : 1.5,
                  pb: 1.5,
                  borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,.06)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "primary.main",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {formatSessionDate(item.opportunityStartDate!)}
                </Typography>

                <Typography sx={{ fontSize: 14, fontWeight: 600, mt: "2px" }}>
                  {item.opportunityTitle ?? ""}
                </Typography>

                {item.opportunityLocation && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: "2px",
                    }}
                  >
                    <PlaceOutlinedIcon
                      sx={{ fontSize: 13, color: "text.secondary" }}
                    />
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      {item.opportunityLocation}
                    </Typography>
                  </Box>
                )}

                <Chip
                  size="small"
                  label={chip.label}
                  color={chip.color}
                  sx={{ mt: 1, fontWeight: 500 }}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
}
