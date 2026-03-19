"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { type JSX } from "react";

import { useOnboarding } from "@/hooks/use-onboarding";

type ChecklistItem = {
  label: string;
  done: boolean;
  href: string;
  detail?: string;
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
      detail: "Add your phone number and bio",
    },
    {
      label: "Set your availability",
      done: status.availabilitySet,
      href: "/volunteer/profile",
      detail: "Let us know when you're available",
    },
    {
      label: "Add your skills",
      done: status.skillsAdded,
      href: "/volunteer/profile",
      detail: "Share the skills you bring",
    },
    {
      label: "Add your interests",
      done: status.interestsAdded,
      href: "/volunteer/profile",
      detail: "Tell us what areas excite you",
    },
    {
      label: "Sign media release",
      done: status.mediaReleaseSigned,
      href: "/volunteer/profile",
      detail: "Authorize use of your photos/videos",
    },
    {
      label: "Review onboarding documents",
      done: status.documentsCompleted,
      href: "/volunteer/onboarding",
      detail:
        status.documentProgress.required === 0
          ? "No required documents"
          : `${status.documentProgress.signed} of ${status.documentProgress.required} signed`,
    },
  ];

  return (
    <Box>
      {/* Progress bar */}
      <Box mb={3}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={0.5}
        >
          <Typography variant="body2" fontWeight={500}>
            Onboarding progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {status.completionPercentage}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={status.completionPercentage}
          sx={{ height: 8, borderRadius: 4 }}
          color={status.onboardingComplete ? "success" : "primary"}
        />
        {status.onboardingComplete && (
          <Typography
            variant="caption"
            color="success.main"
            mt={0.5}
            display="block"
          >
            Onboarding complete!
          </Typography>
        )}
      </Box>

      {/* Checklist items */}
      <Stack spacing={1.5}>
        {items.map((item) => (
          <Box
            key={item.label}
            component={Link}
            href={item.href}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              p: 1.5,
              borderRadius: 1,
              border: 1,
              borderColor: item.done ? "success.light" : "divider",
              bgcolor: item.done ? "success.50" : "background.paper",
              textDecoration: "none",
              color: "inherit",
              "&:hover": {
                bgcolor: item.done ? "success.100" : "action.hover",
              },
              transition: "background-color 0.15s",
            }}
          >
            {item.done ? (
              <CheckCircleIcon color="success" sx={{ mt: 0.1 }} />
            ) : (
              <RadioButtonUncheckedIcon color="disabled" sx={{ mt: 0.1 }} />
            )}
            <Box>
              <Typography variant="body2" fontWeight={item.done ? 400 : 500}>
                {item.label}
              </Typography>
              {item.detail && (
                <Typography variant="caption" color="text.secondary">
                  {item.detail}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
