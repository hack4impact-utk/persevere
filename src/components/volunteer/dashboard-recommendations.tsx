"use client";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { JSX, useState } from "react";

import OpportunityDetailModal from "@/components/volunteer/opportunity-detail-modal";
import type { Opportunity } from "@/components/volunteer/types";
import { formatDate, formatTime } from "@/components/volunteer/utils";
import { useRecommendations } from "@/hooks/use-recommendations";

type CardProps = {
  opportunity: Opportunity & { matchScore: number };
  onClick: () => void;
};

function RecommendationCard({ opportunity, onClick }: CardProps): JSX.Element {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 2,
        boxShadow: 2,
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={1}
          mb={0.75}
        >
          <Typography
            variant="subtitle1"
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
          <Chip
            label={`${opportunity.matchScore} match${opportunity.matchScore === 1 ? "" : "es"}`}
            color="success"
            size="small"
          />
        </Box>

        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <CalendarTodayIcon sx={{ fontSize: 13, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            {formatDate(opportunity.startDate)} &middot;{" "}
            {formatTime(opportunity.startDate)}
          </Typography>
        </Box>

        {opportunity.location && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationOnIcon sx={{ fontSize: 13, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {opportunity.location}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardRecommendations(): JSX.Element | null {
  const { recommendations, loading } = useRecommendations();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (loading || recommendations.length === 0) return null;

  const displayed = recommendations.slice(0, 3);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Recommended for You
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {displayed.map((opp) => (
          <RecommendationCard
            key={opp.id}
            opportunity={opp}
            onClick={() => {
              setSelectedId(opp.id);
            }}
          />
        ))}
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <Link
          component={NextLink}
          href="/volunteer/opportunities"
          underline="hover"
          variant="body2"
        >
          View all opportunities →
        </Link>
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
