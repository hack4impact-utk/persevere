"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { JSX } from "react";

import { useOnboarding } from "@/hooks/use-onboarding";

export default function OnboardingProgressCard(): JSX.Element {
  const { status, isLoading, error } = useOnboarding();

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: 2, height: "100%" }}>
        <CardContent
          sx={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: 2, height: "100%" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const percentage = status?.completionPercentage ?? 0;
  const isComplete = status?.onboardingComplete ?? false;
  const ringColor = isComplete ? "success.main" : "primary.main";

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 2.5,
          "&:last-child": { pb: 2.5 },
        }}
      >
        <Typography variant="h6" fontWeight={700} mb={3} textAlign="center">
          Onboarding Progress
        </Typography>

        <Box sx={{ position: "relative", display: "inline-flex" }}>
          {/* Track ring */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={140}
            thickness={4}
            sx={{
              color: "action.disabledBackground",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
          {/* Value arc */}
          <CircularProgress
            variant="determinate"
            value={percentage}
            size={140}
            thickness={4}
            sx={{ color: ringColor }}
          />
          {/* Center label */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="h4" fontWeight={700} color={ringColor}>
              {percentage}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Complete
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Bottom CTA */}
      <Box
        component={Link}
        href="/volunteer/onboarding"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2.5,
          py: 2,
          borderTop: 1,
          borderColor: "divider",
          textDecoration: "none",
          color: "primary.main",
          "&:hover": { bgcolor: "action.hover" },
          transition: "background-color 0.15s",
          borderRadius: "0 0 8px 8px",
        }}
      >
        <ArrowForwardIcon fontSize="small" />
        <Typography variant="body2" fontWeight={600} color="primary.main">
          Complete onboarding
        </Typography>
      </Box>
    </Card>
  );
}
