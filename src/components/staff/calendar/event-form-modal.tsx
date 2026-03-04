"use client";

import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { JSX, useState } from "react";

import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { useOpportunitySkills } from "@/hooks/use-opportunity-skills";
import type { CatalogInterest, CatalogSkill } from "@/hooks/use-skills";
import { useSkills } from "@/hooks/use-skills";

type EventFormData = {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  maxVolunteers: string;
};

type RecurrenceEndCondition = "endDate" | "count";

type RecurrenceData = {
  frequency: "daily" | "weekly" | "monthly";
  interval: string;
  endCondition: RecurrenceEndCondition;
  endDate: string;
  count: string;
};

type EventFormModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialDates?: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };
};

const defaultFormData: EventFormData = {
  title: "",
  description: "",
  location: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  maxVolunteers: "",
};

const defaultRecurrence: RecurrenceData = {
  frequency: "weekly",
  interval: "1",
  endCondition: "endDate",
  endDate: "",
  count: "4",
};

export default function EventFormModal({
  open,
  onClose,
  onCreated,
  initialDates,
}: EventFormModalProps): JSX.Element {
  const { createEvent } = useCalendarEvents();
  const { skills: catalogSkills, interests: catalogInterests } = useSkills();
  const { applyToEvents } = useOpportunitySkills(null);

  const [formData, setFormData] = useState<EventFormData>(() => ({
    ...defaultFormData,
    ...initialDates,
  }));

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] =
    useState<RecurrenceData>(defaultRecurrence);
  const [selectedSkills, setSelectedSkills] = useState<CatalogSkill[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<CatalogInterest[]>(
    [],
  );

  // Sync initialDates when modal opens
  const handleOpen = (): void => {
    setFormData({
      ...defaultFormData,
      ...initialDates,
    });
    setIsRecurring(false);
    setRecurrence(defaultRecurrence);
    setSelectedSkills([]);
    setSelectedInterests([]);
  };

  const handleClose = (): void => {
    onClose();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.title.trim()) {
      enqueueSnackbar("Title is required", { variant: "error" });
      return;
    }
    if (
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime
    ) {
      enqueueSnackbar("Start and end date/time are required", {
        variant: "error",
      });
      return;
    }

    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`,
    );
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      enqueueSnackbar("End date/time must be after start date/time", {
        variant: "error",
      });
      return;
    }

    try {
      const createdEvents = await createEvent({
        title: formData.title,
        description: formData.description || undefined,
        location: formData.location || undefined,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        maxVolunteers: formData.maxVolunteers
          ? Number.parseInt(formData.maxVolunteers, 10)
          : undefined,
        isRecurring,
        recurrencePattern: isRecurring
          ? {
              frequency: recurrence.frequency,
              interval: Number.parseInt(recurrence.interval, 10) || 1,
              ...(recurrence.endCondition === "endDate" && recurrence.endDate
                ? { endDate: recurrence.endDate }
                : {}),
              ...(recurrence.endCondition === "count" && recurrence.count
                ? { count: Number.parseInt(recurrence.count, 10) || 1 }
                : {}),
            }
          : undefined,
      });

      let tagError = false;
      if (
        createdEvents.length > 0 &&
        (selectedSkills.length > 0 || selectedInterests.length > 0)
      ) {
        try {
          const eventIds = createdEvents.map((e) => Number.parseInt(e.id, 10));
          await applyToEvents(
            eventIds,
            selectedSkills.map((s) => s.id),
            selectedInterests.map((i) => i.id),
          );
        } catch {
          tagError = true;
        }
      }

      enqueueSnackbar(
        tagError
          ? "Event created but failed to tag some skills/interests"
          : "Event created successfully",
        { variant: tagError ? "warning" : "success" },
      );
      onCreated();
      onClose();
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to create event",
        { variant: "error" },
      );
      console.error("Error creating event:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionProps={{ onEnter: handleOpen }}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.5rem", pb: 1 }}>
        Create New Event
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          <TextField
            label="Title"
            required
            fullWidth
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <TextField
            label="Location"
            fullWidth
            value={formData.location}
            onChange={(e) => {
              setFormData({ ...formData, location: e.target.value });
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              required
              fullWidth
              value={formData.startDate}
              onChange={(e) => {
                setFormData({ ...formData, startDate: e.target.value });
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              label="Start Time"
              type="time"
              required
              fullWidth
              value={formData.startTime}
              onChange={(e) => {
                setFormData({ ...formData, startTime: e.target.value });
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="End Date"
              type="date"
              required
              fullWidth
              value={formData.endDate}
              onChange={(e) => {
                setFormData({ ...formData, endDate: e.target.value });
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              label="End Time"
              type="time"
              required
              fullWidth
              value={formData.endTime}
              onChange={(e) => {
                setFormData({ ...formData, endTime: e.target.value });
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Box>
          <TextField
            label="Max Volunteers"
            type="number"
            fullWidth
            value={formData.maxVolunteers}
            onChange={(e) => {
              setFormData({ ...formData, maxVolunteers: e.target.value });
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <Autocomplete
            multiple
            options={catalogSkills}
            getOptionLabel={(o) => o.name}
            value={selectedSkills}
            onChange={(_, value) => {
              setSelectedSkills(value);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Required Skills"
                placeholder="Add skills..."
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            )}
          />

          <Autocomplete
            multiple
            options={catalogInterests}
            getOptionLabel={(o) => o.name}
            value={selectedInterests}
            onChange={(_, value) => {
              setSelectedInterests(value);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Related Interests"
                placeholder="Add interests..."
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            )}
          />

          {/* Recurring toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                }}
              />
            }
            label="Repeats"
          />

          {isRecurring && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                pl: 2,
                borderLeft: "2px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Typography variant="body2" sx={{ minWidth: 60 }}>
                  Every
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={recurrence.interval}
                  onChange={(e) => {
                    setRecurrence({ ...recurrence, interval: e.target.value });
                  }}
                  inputProps={{ min: 1 }}
                  sx={{ width: 80 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={recurrence.frequency}
                    onChange={(e) => {
                      setRecurrence({
                        ...recurrence,
                        frequency: e.target.value as
                          | "daily"
                          | "weekly"
                          | "monthly",
                      });
                    }}
                  >
                    <MenuItem value="daily">Day(s)</MenuItem>
                    <MenuItem value="weekly">Week(s)</MenuItem>
                    <MenuItem value="monthly">Month(s)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <FormControl>
                <FormLabel sx={{ fontSize: "0.875rem" }}>
                  End condition
                </FormLabel>
                <RadioGroup
                  value={recurrence.endCondition}
                  onChange={(e) => {
                    setRecurrence({
                      ...recurrence,
                      endCondition: e.target.value as RecurrenceEndCondition,
                    });
                  }}
                >
                  <FormControlLabel
                    value="endDate"
                    control={<Radio size="small" />}
                    label="End date"
                  />
                  {recurrence.endCondition === "endDate" && (
                    <TextField
                      type="date"
                      size="small"
                      value={recurrence.endDate}
                      onChange={(e) => {
                        setRecurrence({
                          ...recurrence,
                          endDate: e.target.value,
                        });
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{ ml: 4, mb: 1, width: 200 }}
                    />
                  )}
                  <FormControlLabel
                    value="count"
                    control={<Radio size="small" />}
                    label="After N occurrences"
                  />
                  {recurrence.endCondition === "count" && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        ml: 4,
                        mb: 1,
                      }}
                    >
                      <TextField
                        type="number"
                        size="small"
                        value={recurrence.count}
                        onChange={(e) => {
                          setRecurrence({
                            ...recurrence,
                            count: e.target.value,
                          });
                        }}
                        inputProps={{ min: 1 }}
                        sx={{ width: 80 }}
                      />
                      <Typography variant="body2">occurrences</Typography>
                    </Box>
                  )}
                </RadioGroup>
              </FormControl>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            void handleSubmit();
          }}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            boxShadow: 2,
          }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
