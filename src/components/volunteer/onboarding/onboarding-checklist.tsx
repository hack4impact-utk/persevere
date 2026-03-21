"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { type JSX } from "react";

import { useOnboarding } from "@/hooks/use-onboarding";

type ChecklistItem = {
  label: string;
  done: boolean;
  href?: string;
};

export default function OnboardingChecklist(): JSX.Element {
  const { status, isLoading, error } = useOnboarding();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!status) {
    return (
      <Typography variant="body2" color="text.secondary">
        Unable to load onboarding status.
      </Typography>
    );
  }

  const items: ChecklistItem[] = [
    {
      label: "Complete your profile",
      done: status.profileFilled,
      href: "/volunteer/profile",
    },
    {
      label: "Set your availability",
      done: status.availabilitySet,
      href: "/volunteer/profile",
    },
    {
      label: "Add your skills",
      done: status.skillsAdded,
      href: "/volunteer/profile",
    },
    {
      label: "Add your interests",
      done: status.interestsAdded,
      href: "/volunteer/profile",
    },
    {
      label: "Complete documents",
      done: status.documentsCompleted,
    },
  ];

  const ringColor = status.onboardingComplete ? "success.main" : "primary.main";

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        border: 1,
        borderColor: "divider",
        height: 520,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top half — circular progress ring */}
      <Box
        sx={{
          flex: "0 0 45%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          px: 2,
          pt: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600} textAlign="center">
          Your Onboarding Progress
        </Typography>

        <Box sx={{ position: "relative", display: "inline-flex" }}>
          {/* Track ring */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={120}
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
            value={status.completionPercentage}
            size={120}
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
            <Typography variant="h5" fontWeight={700} color={ringColor}>
              {status.completionPercentage}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Complete
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Bottom half — scrollable checklist */}
      <Box
        sx={{
          flex: "0 0 55%",
          display: "flex",
          flexDirection: "column",
          borderTop: 1,
          borderColor: "divider",
          px: 2,
          pt: 1.5,
          pb: 1,
          minHeight: 0,
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ mb: 0.5, display: "block", lineHeight: 1.5 }}
        >
          Steps
        </Typography>

        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {items.map((item) =>
            item.href ? (
              <Box
                key={item.label}
                component={Link}
                href={item.href}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1,
                  py: 1,
                  borderRadius: 1,
                  textDecoration: "none",
                  color: "inherit",
                  "&:hover": { bgcolor: "action.hover" },
                  transition: "background-color 0.15s",
                }}
              >
                {item.done ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={item.done ? "success.main" : "text.primary"}
                  sx={{ fontWeight: item.done ? 500 : 400 }}
                >
                  {item.label}
                </Typography>
              </Box>
            ) : (
              <Box
                key={item.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1,
                  py: 1,
                  borderRadius: 1,
                }}
              >
                {item.done ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={item.done ? "success.main" : "text.primary"}
                  sx={{ fontWeight: item.done ? 500 : 400 }}
                >
                  {item.label}
                </Typography>
              </Box>
            ),
          )}
        </Box>
      </Box>
    </Card>
  );
}
