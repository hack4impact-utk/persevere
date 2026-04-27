"use client";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { JSX, useState } from "react";

import { AsyncContent } from "@/components/shared";
import { OpportunityCard } from "@/components/volunteer/opportunity-card";
import OpportunityDetailModal from "@/components/volunteer/opportunity-detail-modal";
import { useRecommendations } from "@/hooks/use-recommendations";

type Props = {
  onRsvpChange: () => void;
};

export default function DashboardRecommendations({
  onRsvpChange,
}: Props): JSX.Element {
  const { recommendations, loading, error } = useRecommendations();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rsvpedIds, setRsvpedIds] = useState(() => new Set<number>());

  const selectedOpp =
    selectedId === null
      ? null
      : (recommendations.find((r) => r.id === selectedId) ?? null);

  // Merge server-known RSVP status with locally-tracked RSVPs from this session
  const effectiveRsvpStatus =
    selectedId !== null && rsvpedIds.has(selectedId)
      ? ("pending" as const)
      : selectedOpp?.rsvpStatus;

  const isRsvped =
    effectiveRsvpStatus !== undefined &&
    effectiveRsvpStatus !== "cancelled" &&
    effectiveRsvpStatus !== "declined";

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <CampaignOutlinedIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" fontWeight={700}>
              Recommended for You
            </Typography>
          </Box>
          <Typography
            component={NextLink}
            href="/volunteer/opportunities"
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "primary.main",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            See all
          </Typography>
        </Box>

        <AsyncContent
          loading={loading}
          error={error}
          empty={recommendations.length === 0}
          emptyMessage="No immediate recommendations right now. Browse all opportunities to find ones you like!"
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
              },
              gap: 2,
              height: 288,
              overflowY: "auto",
              alignItems: "start",
              pr: 0.5,
            }}
          >
            {recommendations.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                matchScore={opp.matchScore}
                rsvpStatus={
                  rsvpedIds.has(opp.id) ? ("pending" as const) : opp.rsvpStatus
                }
                onClick={() => {
                  setSelectedId(opp.id);
                }}
              />
            ))}
          </Box>
        </AsyncContent>

        <OpportunityDetailModal
          opportunityId={selectedId}
          isRsvped={isRsvped}
          rsvpStatus={effectiveRsvpStatus}
          open={selectedId !== null}
          onClose={() => {
            setSelectedId(null);
          }}
          onRsvpChange={(newIsRsvped) => {
            if (newIsRsvped && selectedId !== null) {
              setRsvpedIds((prev) => new Set([...prev, selectedId]));
            }
            setSelectedId(null);
            onRsvpChange();
          }}
        />
      </CardContent>
    </Card>
  );
}
