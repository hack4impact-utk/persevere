"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { type JSX, useEffect, useRef, useState } from "react";

import type { OnboardingStatus } from "@/services/onboarding.service";

type ChecklistItem = {
  label: string;
  done: boolean;
  href?: string;
};

type OnboardingChecklistProps = {
  status: OnboardingStatus | null;
  isLoading: boolean;
  error: string | null;
};

export default function OnboardingChecklist({
  status,
  isLoading,
  error,
}: OnboardingChecklistProps): JSX.Element | null {
  const [minimized, setMinimized] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevCompleteRef = useRef<boolean | null>(null);

  useEffect((): (() => void) | void => {
    if (status === null) return;

    const isComplete = status.onboardingComplete;

    if (prevCompleteRef.current === null) {
      prevCompleteRef.current = isComplete;
      if (!isComplete) {
        setVisible(true);
        setMounted(true);
      }
      return;
    }

    if (isComplete && !prevCompleteRef.current) {
      const fadeTimer = setTimeout(() => {
        setVisible(false);
        const unmountTimer = setTimeout(() => {
          setMounted(false);
        }, 500);
        return (): void => clearTimeout(unmountTimer);
      }, 1500);
      return (): void => clearTimeout(fadeTimer);
    }
    prevCompleteRef.current = isComplete;
  }, [status]);

  if (!mounted) return null;

  const ringColor = status?.onboardingComplete
    ? "success.main"
    : "primary.main";
  const pct = status?.completionPercentage ?? 0;

  const items: ChecklistItem[] = status
    ? [
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
      ]
    : [];

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 1200,
        transition: "opacity 0.5s ease, transform 0.5s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.9) translateY(-8px)",
      }}
    >
      {minimized ? (
        /* ── Minimized pill ── */
        <Paper
          elevation={6}
          sx={{
            borderRadius: 4,
            px: 1.5,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            "&:hover": { bgcolor: "action.hover" },
            transition: "background-color 0.15s",
          }}
          onClick={() => setMinimized(false)}
        >
          {/* Mini progress ring */}
          <Box
            sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
          >
            <CircularProgress
              variant="determinate"
              value={100}
              size={40}
              thickness={3.5}
              sx={{
                color: "action.disabledBackground",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
            {isLoading ? (
              <CircularProgress size={40} thickness={3.5} />
            ) : (
              <CircularProgress
                variant="determinate"
                value={pct}
                size={40}
                thickness={3.5}
                sx={{ color: ringColor }}
              />
            )}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                color={ringColor}
                sx={{ fontSize: "0.6rem" }}
              >
                {pct}%
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="body2"
            fontWeight={500}
            sx={{ whiteSpace: "nowrap" }}
          >
            Onboarding progress
          </Typography>

          <IconButton
            size="small"
            aria-label="expand onboarding checklist"
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(false);
            }}
            sx={{ ml: -0.5 }}
          >
            <ExpandLessIcon fontSize="small" />
          </IconButton>
        </Paper>
      ) : (
        /* ── Expanded card ── */
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            border: 1,
            borderColor: "divider",
            width: 300,
            height: 480,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top — circular progress ring */}
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
              position: "relative",
            }}
          >
            {/* Minimize button */}
            <IconButton
              size="small"
              aria-label="minimize onboarding checklist"
              onClick={() => setMinimized(true)}
              sx={{ position: "absolute", top: 8, right: 8 }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>

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
              {isLoading ? (
                <CircularProgress size={120} thickness={4} />
              ) : (
                <CircularProgress
                  variant="determinate"
                  value={pct}
                  size={120}
                  thickness={4}
                  sx={{ color: ringColor }}
                />
              )}
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
                {isLoading ? (
                  <Typography variant="caption" color="text.secondary">
                    Loading…
                  </Typography>
                ) : error ? (
                  <Typography variant="caption" color="error">
                    Error
                  </Typography>
                ) : (
                  <>
                    <Typography variant="h5" fontWeight={700} color={ringColor}>
                      {pct}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Complete
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </Box>

          {/* Bottom — scrollable checklist */}
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
                      <RadioButtonUncheckedIcon
                        color="disabled"
                        fontSize="small"
                      />
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
                      <RadioButtonUncheckedIcon
                        color="disabled"
                        fontSize="small"
                      />
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
      )}
    </Box>
  );
}
