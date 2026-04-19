"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { JSX, useState } from "react";

import { OpportunityCard } from "@/components/volunteer/opportunity-card";
import OpportunityDetailModal from "@/components/volunteer/opportunity-detail-modal";
import { useRecommendations } from "@/hooks/use-recommendations";

export default function DashboardRecommendations(): JSX.Element | null {
  const { recommendations, loading } = useRecommendations();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (loading || recommendations.length === 0) return null;

  const displayed = recommendations.slice(0, 3);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontWeight={700}>
            Recommended for You
          </Typography>
        </Box>
        <Link
          component={NextLink}
          href="/volunteer/opportunities"
          variant="body2"
          sx={{ fontWeight: 600, color: "primary.main" }}
        >
          See all
        </Link>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
          },
          gap: 2,
        }}
      >
        {displayed.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            matchScore={opp.matchScore}
            onClick={() => {
              setSelectedId(opp.id);
            }}
          />
        ))}
      </Box>

      <OpportunityDetailModal
        opportunityId={selectedId}
        isRsvped={false}
        open={selectedId !== null}
        onClose={() => {
          setSelectedId(null);
        }}
        onRsvpChange={() => {
          setSelectedId(null);
        }}
      />
    </Box>
  );
}
