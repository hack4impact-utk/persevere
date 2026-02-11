"use client";

import { Box, Checkbox, Paper, Typography } from "@mui/material";
import { JSX } from "react";

type AvailabilityData = Record<string, string[] | boolean | number | string>;

type AvailabilityEditorProps = {
  value: AvailabilityData;
  onChange: (value: AvailabilityData) => void;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_SLOTS = ["morning", "afternoon", "evening"];

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

/**
 * AvailabilityEditor
 *
 * Interactive 7x3 grid for selecting volunteer availability.
 * Days of the week × time slots (Morning/Afternoon/Evening).
 * Outputs JSON format matching the schema.
 */
export default function AvailabilityEditor({
  value,
  onChange,
}: AvailabilityEditorProps): JSX.Element {
  const handleToggle = (day: string, timeSlot: string): void => {
    const dayKey = day.toLowerCase();
    const currentSlots = Array.isArray(value[dayKey]) ? value[dayKey] : [];
    const slots = currentSlots as string[];

    const newSlots = slots.includes(timeSlot)
      ? slots.filter((slot) => slot !== timeSlot)
      : [...slots, timeSlot];

    onChange({
      ...value,
      [dayKey]: newSlots,
    });
  };

  const isChecked = (day: string, timeSlot: string): boolean => {
    const dayKey = day.toLowerCase();
    const slots = value[dayKey];
    return Array.isArray(slots) && slots.includes(timeSlot);
  };

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
      <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
        Select your availability
      </Typography>

      {/* Header Row */}
      <Box
        display="grid"
        gridTemplateColumns="120px repeat(3, 1fr)"
        gap={1}
        sx={{ mb: 1 }}
      >
        <Box />
        {TIME_SLOTS.map((slot) => (
          <Box key={slot} textAlign="center">
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              {TIME_SLOT_LABELS[slot]}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Grid Rows */}
      {DAYS.map((day) => (
        <Box
          key={day}
          display="grid"
          gridTemplateColumns="120px repeat(3, 1fr)"
          gap={1}
          sx={{
            py: 0.5,
            "&:hover": {
              bgcolor: "action.hover",
              borderRadius: 1,
            },
          }}
        >
          <Typography variant="body2" sx={{ py: 1 }}>
            {day}
          </Typography>
          {TIME_SLOTS.map((slot) => (
            <Box key={slot} textAlign="center">
              <Checkbox
                checked={isChecked(day, slot)}
                onChange={() => handleToggle(day, slot)}
                size="small"
                sx={{
                  py: 0.5,
                }}
              />
            </Box>
          ))}
        </Box>
      ))}
    </Paper>
  );
}
