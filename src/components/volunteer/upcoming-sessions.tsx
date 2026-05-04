"use client";

import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import { EmptyState } from "@/components/ui";
import type { RsvpItem } from "@/components/volunteer/types";

type UpcomingSessionsProps = {
  rsvpItems: RsvpItem[];
  loading?: boolean;
  /** When provided, each session row becomes interactive and fires this callback. */
  onItemClick?: (opportunityId: number) => void;
  /** Override the default vertical scroll cap (320px). Pass null to remove. */
  maxHeight?: number | null;
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
  loading,
  onItemClick,
  maxHeight = 320,
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

  const cardSx = {
    p: "18px",
    borderRadius: 2,
    border: "1px solid",
    borderColor: "divider",
    alignSelf: "start",
    position: { lg: "sticky" },
    top: { lg: 24 },
  };

  if (loading) {
    return (
      <Card elevation={1} sx={cardSx}>
        <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 1.5 }}>
          Your upcoming sessions
        </Typography>
        <Stack spacing={2}>
          {[0, 1, 2].map((i) => (
            <Box key={i}>
              <Skeleton variant="text" width="50%" height={14} />
              <Skeleton variant="text" width="80%" height={18} />
              <Skeleton
                variant="rounded"
                width={70}
                height={22}
                sx={{ mt: 0.75 }}
              />
            </Box>
          ))}
        </Stack>
      </Card>
    );
  }

  return (
    <Card elevation={1} sx={cardSx}>
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
            ...(maxHeight === null ? {} : { maxHeight, overflowY: "auto" }),
          }}
        >
          {upcoming.map((item, i) => {
            const chip = statusChipProps(item.rsvpStatus);
            const rowSx = {
              pt: i === 0 ? 0 : 1.5,
              pb: 1.5,
              borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,.06)",
              display: "block",
              textAlign: "left",
              width: "100%",
            };
            const rowContents = (
              <>
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
              </>
            );

            return onItemClick ? (
              <ButtonBase
                key={item.opportunityId}
                onClick={() => onItemClick(item.opportunityId)}
                sx={{
                  ...rowSx,
                  borderRadius: 1,
                  px: 0.5,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {rowContents}
              </ButtonBase>
            ) : (
              <Box key={item.opportunityId} sx={rowSx}>
                {rowContents}
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
}
