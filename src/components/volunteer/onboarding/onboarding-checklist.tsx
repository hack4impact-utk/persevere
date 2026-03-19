"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
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

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        border: 1,
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Your Onboarding Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {status.completionPercentage}%
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={status.completionPercentage}
          sx={{ height: 8, borderRadius: 4, my: 2 }}
        />

        <Box display="flex" flexWrap="wrap" gap={1.5}>
          {items.map((item) =>
            item.href ? (
              <Box
                key={item.label}
                component={Link}
                href={item.href}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 1,
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
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                )}
                <Typography variant="body2">{item.label}</Typography>
              </Box>
            ) : (
              <Box
                key={item.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  border: 1,
                  borderColor: item.done ? "success.light" : "divider",
                  bgcolor: item.done ? "success.50" : "background.paper",
                  color: "text.secondary",
                }}
              >
                {item.done ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                )}
                <Typography variant="body2">{item.label}</Typography>
              </Box>
            ),
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
