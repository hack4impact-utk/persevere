"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { JSX } from "react";

import { useOnboarding } from "@/hooks/use-onboarding";

type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  href: string;
};

export default function OnboardingChecklist(): JSX.Element {
  const { status, isLoading, error } = useOnboarding();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!status || status.onboardingComplete) {
    return <></>;
  }

  const items: ChecklistItem[] = [
    {
      key: "profileFilled",
      label: "Complete your profile (phone & bio)",
      done: status.profileFilled,
      href: "/volunteer/profile",
    },
    {
      key: "availabilitySet",
      label: "Set your availability",
      done: status.availabilitySet,
      href: "/volunteer/profile",
    },
    {
      key: "skillsAdded",
      label: "Add at least one skill",
      done: status.skillsAdded,
      href: "/volunteer/profile",
    },
    {
      key: "interestsAdded",
      label: "Add at least one interest",
      done: status.interestsAdded,
      href: "/volunteer/profile",
    },
    {
      key: "documentsCompleted",
      label: "Complete onboarding documents",
      done: status.documentsCompleted,
      href: "/volunteer/onboarding",
    },
  ];

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Onboarding Checklist
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={1}>
          Complete these steps to finish setting up your profile.
        </Typography>

        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <LinearProgress
            variant="determinate"
            value={status.completionPercentage}
            sx={{ flex: 1, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" fontWeight={600} sx={{ minWidth: 40 }}>
            {status.completionPercentage}%
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        <List dense disablePadding>
          {items.map((item) => (
            <ListItem
              key={item.key}
              disableGutters
              component={Link}
              href={item.href}
              sx={{
                textDecoration: "none",
                color: "inherit",
                borderRadius: 1,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {item.done ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  variant: "body2",
                  sx: {
                    textDecoration: item.done ? "line-through" : "none",
                    color: item.done ? "text.disabled" : "text.primary",
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
