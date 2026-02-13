"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { JSX } from "react";

export type TimeRange = { start: string; end: string };
export type AvailabilityData = Record<string, TimeRange[]>;

type AvailabilityEditorProps = {
  value: AvailabilityData;
  onChange: (value: AvailabilityData) => void;
};

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DEFAULT_RANGE: TimeRange = { start: "09:00", end: "17:00" };

function validateRanges(ranges: TimeRange[]): string | null {
  for (const r of ranges) {
    if (r.start >= r.end) return "Start must be before end";
  }
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < sorted[i - 1].end) return "Ranges overlap";
  }
  return null;
}

/**
 * AvailabilityEditor
 *
 * Per-day time range picker. Multiple ranges per day supported.
 * Output format: Record<day, { start: "HH:mm", end: "HH:mm" }[]>
 */
export default function AvailabilityEditor({
  value,
  onChange,
}: AvailabilityEditorProps): JSX.Element {
  const handleAdd = (day: string): void => {
    const existing = value[day] ?? [];
    onChange({ ...value, [day]: [...existing, { ...DEFAULT_RANGE }] });
  };

  const handleRemove = (day: string, index: number): void => {
    const updated = (value[day] ?? []).filter((_, i) => i !== index);
    if (updated.length === 0) {
      const next = { ...value };
      delete next[day];
      onChange(next);
    } else {
      onChange({ ...value, [day]: updated });
    }
  };

  const handleChange = (
    day: string,
    index: number,
    field: "start" | "end",
    val: string,
  ): void => {
    const updated = (value[day] ?? []).map((r, i) =>
      i === index ? { ...r, [field]: val } : r,
    );
    onChange({ ...value, [day]: updated });
  };

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "grey.200",
        borderRadius: 2,
        maxHeight: 340,
        overflowY: "scroll",
        width: "100%",
      }}
    >
      {DAYS.map((day, dayIndex) => {
        const ranges = value[day] ?? [];
        const error = ranges.length > 0 ? validateRanges(ranges) : null;

        return (
          <Box key={day}>
            {dayIndex > 0 && <Divider />}
            <Box sx={{ px: 2, py: 1.5 }}>
              {/* Day header row */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={ranges.length > 0 ? 1 : 0}
              >
                <Typography variant="body2" fontWeight={600}>
                  {DAY_LABELS[day]}
                </Typography>
                <Button
                  type="button"
                  size="small"
                  startIcon={<AddIcon sx={{ fontSize: "0.9rem !important" }} />}
                  onClick={() => handleAdd(day)}
                  sx={{
                    fontSize: "0.75rem",
                    py: 0.25,
                    color: "text.secondary",
                    "&:hover": { color: "text.primary" },
                  }}
                >
                  Add range
                </Button>
              </Box>

              {/* Time range rows */}
              {ranges.length === 0 && (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ display: "block", pb: 0.25 }}
                >
                  Not available
                </Typography>
              )}

              {ranges.map((range, i) => (
                <Box
                  key={i}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={i < ranges.length - 1 ? 0.75 : 0}
                >
                  <TextField
                    type="time"
                    size="small"
                    value={range.start}
                    onChange={(e) =>
                      handleChange(day, i, "start", e.target.value)
                    }
                    slotProps={{ htmlInput: { step: 900 } }}
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    sx={{ flexShrink: 0 }}
                  >
                    –
                  </Typography>
                  <TextField
                    type="time"
                    size="small"
                    value={range.end}
                    onChange={(e) =>
                      handleChange(day, i, "end", e.target.value)
                    }
                    slotProps={{ htmlInput: { step: 900 } }}
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                  <IconButton
                    type="button"
                    size="small"
                    onClick={() => handleRemove(day, i)}
                    aria-label={`Remove range ${i + 1} for ${DAY_LABELS[day]}`}
                    sx={{ flexShrink: 0, color: "text.disabled" }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ))}

              {error && (
                <Typography
                  variant="caption"
                  color="error"
                  display="block"
                  mt={0.5}
                >
                  {error}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
