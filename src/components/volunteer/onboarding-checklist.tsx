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
import { JSX } from "react";

import { useOnboarding } from "@/hooks/use-onboarding";

type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
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
    },
    {
      key: "availabilitySet",
      label: "Set your availability",
      done: status.availabilitySet,
    },
    {
      key: "skillsAdded",
      label: "Add at least one skill",
      done: status.skillsAdded,
    },
    {
      key: "interestsAdded",
      label: "Add at least one interest",
      done: status.interestsAdded,
    },
    {
      key: "mediaReleaseSigned",
      label: "Sign the media release consent",
      done: status.mediaReleaseSigned,
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
            <ListItem key={item.key} disableGutters>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {item.done ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon
                    color="disabled"
                    fontSize="small"
                  />
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
