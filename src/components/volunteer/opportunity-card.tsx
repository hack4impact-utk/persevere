import LocationOnIcon from "@mui/icons-material/LocationOn";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { JSX } from "react";

import { SpotsChip } from "@/components/volunteer/spots-chip";
import type { Opportunity } from "@/components/volunteer/types";

// Helper to format date
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

type OpportunityCardProps = {
  opportunity: Opportunity;
  onClick: () => void;
  matchScore?: number;
};

export function OpportunityCard({
  opportunity,
  onClick,
  matchScore,
}: OpportunityCardProps): JSX.Element {
  const month = getMonthShort(opportunity.startDate);
  const day = getDay(opportunity.startDate);
  const time = getTimeShort(opportunity.startDate);

  return (
    <Card
      onClick={onClick}
      elevation={0}
      sx={{
        borderRadius: 2.5, // 10px / 8px scale? approx 2.5 is 20px, actually borderRadius: 2 is 16px if we follow theme. Let's use 2.
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        "&:hover": {
          borderColor: "rgba(50, 123, 247, 0.5)",
          boxShadow:
            "0 1px 2px rgba(0,0,0,.04), 0 4px 16px -4px rgba(50,123,247,.18)",
        },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 76,
          bgcolor: "#f2f6ff",
          color: "#27427f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 1.5,
          borderRight: "1px solid",
          borderRightColor: "rgba(50, 123, 247, 0.14)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "primary.main",
            lineHeight: 1,
          }}
        >
          {month}
        </Typography>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, lineHeight: 1, my: 0.5 }}
        >
          {day}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "rgba(39,66,127,.75)",
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {time}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          p: 2,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={1}
          mb={0.5}
        >
          <Typography
            variant="subtitle1"
            fontWeight={600}
            lineHeight={1.3}
            sx={{
              color: "text.primary",
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {opportunity.title}
          </Typography>
          <Box display="flex" gap={0.5}>
            {matchScore !== undefined && (
               <Chip
                 label={`${matchScore} match`}
                 color="success"
                 size="small"
                 sx={{ borderRadius: 1 }}
               />
             )}
            <SpotsChip opp={opportunity} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>

        {opportunity.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            lineHeight={1.45}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mt: 0.5,
              mb: 1,
              flex: 1,
            }}
          >
            {opportunity.description}
          </Typography>
        )}

        {opportunity.location && (
          <Box display="flex" alignItems="center" gap={0.5} mt="auto">
            <LocationOnIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {opportunity.location}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}
