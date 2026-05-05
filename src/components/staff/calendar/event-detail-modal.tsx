"use client";

import AutorenewIcon from "@mui/icons-material/Autorenew";
import CloseIcon from "@mui/icons-material/Close";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { JSX, useEffect, useState } from "react";

import { MobileDialog } from "@/components/shared";
import { EmptyState, getRsvpStatusColor, StatusBadge } from "@/components/ui";
import type { CalendarEvent } from "@/hooks/use-calendar-events";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { useEventCategories } from "@/hooks/use-event-categories";
import { useEventRsvps } from "@/hooks/use-event-rsvps";
import { useOpportunitySkills } from "@/hooks/use-opportunity-skills";
import type { CatalogInterest, CatalogSkill } from "@/hooks/use-skills";
import { useSkills } from "@/hooks/use-skills";
import { useVolunteerMatches } from "@/hooks/use-volunteer-matches";

type EventDetailModalProps = {
  event: CalendarEvent | null;
  eventId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
};

type EditFormData = {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  maxVolunteers: string;
};

type Mode = "view" | "edit";

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      variant="subtitle2"
      color="text.secondary"
      sx={{
        textTransform: "uppercase",
        fontSize: "0.75rem",
        letterSpacing: "0.05em",
        fontWeight: 600,
        mb: 0.5,
      }}
    >
      {children}
    </Typography>
  );
}

export default function EventDetailModal({
  event,
  eventId,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: EventDetailModalProps): JSX.Element {
  const { updateEvent, deleteEvent, isMutating } = useCalendarEvents();
  const { rsvps, loading: rsvpsLoading, fetchRsvps } = useEventRsvps();
  const {
    matches,
    loading: matchesLoading,
    fetchMatches,
  } = useVolunteerMatches();
  const {
    skills: catalogSkills,
    interests: catalogInterests,
    loadingSkills,
    loadingInterests,
  } = useSkills();
  const { activeCategories } = useEventCategories();

  const numericEventId = eventId ? Number.parseInt(eventId, 10) : null;
  const {
    requiredSkills,
    requiredInterests,
    loading: skillsLoading,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
    refetch: refetchSkills,
  } = useOpportunitySkills(numericEventId);

  const [mode, setMode] = useState<Mode>("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    title: "",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    maxVolunteers: "",
  });
  const [editSelectedSkills, setEditSelectedSkills] = useState<CatalogSkill[]>(
    [],
  );
  const [editSelectedInterests, setEditSelectedInterests] = useState<
    CatalogInterest[]
  >([]);
  const [editCategoryId, setEditCategoryId] = useState<number | "">("");
  const [editInitialSkillIds, setEditInitialSkillIds] = useState<Set<number>>(
    new Set(),
  );
  const [editInitialInterestIds, setEditInitialInterestIds] = useState<
    Set<number>
  >(new Set());

  useEffect(() => {
    if (open && eventId) {
      setMode("view");
      setShowDeleteConfirm(false);
      void fetchRsvps(eventId);
      void fetchMatches(eventId);
    }
  }, [open, eventId, fetchRsvps, fetchMatches]);

  const handleEditClick = (): void => {
    if (!event) return;
    if (skillsLoading || loadingSkills || loadingInterests) {
      enqueueSnackbar(
        "Skills and interests are still loading. Try again shortly.",
        { variant: "info" },
      );
      return;
    }
    const start = new Date(event.start);
    const end = new Date(event.end);
    setEditForm({
      title: event.title,
      description: event.description ?? "",
      location: event.location ?? "",
      startDate: start.toISOString().split("T")[0],
      startTime: start.toTimeString().slice(0, 5),
      endDate: end.toISOString().split("T")[0],
      endTime: end.toTimeString().slice(0, 5),
      maxVolunteers: event.extendedProps?.maxVolunteers?.toString() ?? "",
    });

    const currentSkillIds = new Set(requiredSkills.map((s) => s.skillId));
    const resolvedSkills = catalogSkills.filter((s) =>
      currentSkillIds.has(s.id),
    );
    setEditSelectedSkills(resolvedSkills);
    setEditInitialSkillIds(new Set(resolvedSkills.map((s) => s.id)));

    const currentInterestIds = new Set(
      requiredInterests.map((i) => i.interestId),
    );
    const resolvedInterests = catalogInterests.filter((i) =>
      currentInterestIds.has(i.id),
    );
    setEditSelectedInterests(resolvedInterests);
    setEditInitialInterestIds(new Set(resolvedInterests.map((i) => i.id)));

    setEditCategoryId(event.extendedProps?.categoryId ?? "");
    setMode("edit");
  };

  const handleSave = async (): Promise<void> => {
    if (!event || !editForm.title.trim()) {
      enqueueSnackbar("Title is required", { variant: "error" });
      return;
    }

    const startDateTime = new Date(
      `${editForm.startDate}T${editForm.startTime}`,
    );
    const endDateTime = new Date(`${editForm.endDate}T${editForm.endTime}`);

    if (endDateTime <= startDateTime) {
      enqueueSnackbar("End date/time must be after start date/time", {
        variant: "error",
      });
      return;
    }

    try {
      await updateEvent(event.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        location: editForm.location || undefined,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        maxVolunteers: editForm.maxVolunteers
          ? Number.parseInt(editForm.maxVolunteers, 10)
          : undefined,
        categoryId: editCategoryId || null,
      });

      const latestRequirements = await refetchSkills();

      const currentSkillIds = new Set(
        latestRequirements.requiredSkills.map((s) => s.skillId),
      );
      const selectedSkillIds = new Set(editSelectedSkills.map((s) => s.id));
      const skillsToAdd = editSelectedSkills.filter(
        (s) => !currentSkillIds.has(s.id),
      );
      const skillsToRemove = latestRequirements.requiredSkills.filter(
        (s) =>
          editInitialSkillIds.has(s.skillId) &&
          !selectedSkillIds.has(s.skillId),
      );

      const currentInterestIds = new Set(
        latestRequirements.requiredInterests.map((i) => i.interestId),
      );
      const selectedInterestIds = new Set(
        editSelectedInterests.map((i) => i.id),
      );
      const interestsToAdd = editSelectedInterests.filter(
        (i) => !currentInterestIds.has(i.id),
      );
      const interestsToRemove = latestRequirements.requiredInterests.filter(
        (i) =>
          editInitialInterestIds.has(i.interestId) &&
          !selectedInterestIds.has(i.interestId),
      );

      const tagResults = await Promise.allSettled([
        ...skillsToAdd.map((s) => addSkill(s.id)),
        ...skillsToRemove.map((s) => removeSkill(s.skillId)),
        ...interestsToAdd.map((i) => addInterest(i.id)),
        ...interestsToRemove.map((i) => removeInterest(i.interestId)),
      ]);
      const tagError = tagResults.some(
        (r) => r.status === "fulfilled" && r.value === false,
      );

      await refetchSkills();

      enqueueSnackbar(
        tagError
          ? "Event updated but some skill/interest changes failed"
          : "Event updated successfully",
        { variant: tagError ? "warning" : "success" },
      );
      onUpdated();
      setMode("view");
    } catch (error) {
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to update event",
        { variant: "error" },
      );
      console.error("Error updating event:", error);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!event) return;
    try {
      await deleteEvent(event.id);
      enqueueSnackbar("Event deleted successfully", { variant: "success" });
      onDeleted();
      onClose();
    } catch (error) {
      enqueueSnackbar("Failed to delete event", { variant: "error" });
      console.error("Error deleting event:", error);
    }
  };

  const isRecurring = event?.extendedProps?.isRecurring;
  const maxVol = event?.extendedProps?.maxVolunteers;

  return (
    <MobileDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box
          sx={{
            px: 3.5,
            py: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {mode === "view" ? "Opportunity details" : "Edit opportunity"}
            </Typography>
            <IconButton size="small" onClick={onClose} sx={{ mt: -0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
              {event?.title ?? ""}
            </Typography>
            {isRecurring && (
              <AutorenewIcon
                fontSize="small"
                color="primary"
                titleAccess="Recurring event"
              />
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {event?.extendedProps?.status && (
              <StatusBadge
                label={event.extendedProps.status}
                color={
                  event.extendedProps.status === "open"
                    ? "success"
                    : event.extendedProps.status === "full"
                      ? "default"
                      : event.extendedProps.status === "completed"
                        ? "primary"
                        : "error"
                }
              />
            )}
            {event?.extendedProps?.categoryName && (
              <Chip
                label={event.extendedProps.categoryName}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Scrollable body */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 3.5, py: 3 }}>
          {mode === "view" ? (
            event ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {event.description && (
                  <Box>
                    <SectionLabel>Description</SectionLabel>
                    <Typography>{event.description}</Typography>
                  </Box>
                )}
                {event.location && (
                  <Box>
                    <SectionLabel>Location</SectionLabel>
                    <Typography>{event.location}</Typography>
                  </Box>
                )}
                <Box>
                  <SectionLabel>Start</SectionLabel>
                  <Typography>{formatDateTime(event.start)}</Typography>
                </Box>
                <Box>
                  <SectionLabel>End</SectionLabel>
                  <Typography>{formatDateTime(event.end)}</Typography>
                </Box>
                <Box>
                  <SectionLabel>Capacity</SectionLabel>
                  <Typography>
                    {maxVol == null
                      ? "No limit"
                      : `${rsvps.length} / ${maxVol} volunteers`}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <SectionLabel>Volunteers Signed Up</SectionLabel>
                  {rsvpsLoading ? (
                    <CircularProgress size={20} />
                  ) : rsvps.length === 0 ? (
                    <EmptyState message="No volunteers signed up yet" />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {rsvps.map((r) => (
                        <Box
                          key={r.volunteerId}
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2">
                            {r.firstName} {r.lastName}
                          </Typography>
                          <StatusBadge
                            label={r.rsvpStatus}
                            color={getRsvpStatusColor(r.rsvpStatus)}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                <Box>
                  <SectionLabel>Top Volunteer Matches</SectionLabel>
                  {matchesLoading ? (
                    <CircularProgress size={20} />
                  ) : matches.length === 0 ? (
                    <EmptyState message="No matching volunteers found" />
                  ) : (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {matches.map((m) => (
                        <Box
                          key={m.volunteerId}
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {m.firstName} {m.lastName}
                          </Typography>
                          <Chip
                            label={`${m.matchScore} match${m.matchScore === 1 ? "" : "es"}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                <Box>
                  <SectionLabel>Required Skills</SectionLabel>
                  {skillsLoading ? (
                    <CircularProgress size={16} />
                  ) : requiredSkills.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No skills tagged
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {requiredSkills.map((s) => (
                        <Chip
                          key={s.skillId}
                          label={s.skillName ?? "Unknown"}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                <Box>
                  <SectionLabel>Related Interests</SectionLabel>
                  {skillsLoading ? (
                    <CircularProgress size={16} />
                  ) : requiredInterests.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No interests tagged
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {requiredInterests.map((i) => (
                        <Chip
                          key={i.interestId}
                          label={i.interestName ?? "Unknown"}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              <CircularProgress size={24} />
            )
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Title"
                required
                fullWidth
                value={editForm.title}
                onChange={(e) => {
                  setEditForm({ ...editForm, title: e.target.value });
                }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={editForm.description}
                onChange={(e) => {
                  setEditForm({ ...editForm, description: e.target.value });
                }}
              />
              <TextField
                label="Location"
                fullWidth
                value={editForm.location}
                onChange={(e) => {
                  setEditForm({ ...editForm, location: e.target.value });
                }}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  required
                  fullWidth
                  value={editForm.startDate}
                  onChange={(e) => {
                    setEditForm({ ...editForm, startDate: e.target.value });
                  }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Start Time"
                  type="time"
                  required
                  fullWidth
                  value={editForm.startTime}
                  onChange={(e) => {
                    setEditForm({ ...editForm, startTime: e.target.value });
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="End Date"
                  type="date"
                  required
                  fullWidth
                  value={editForm.endDate}
                  onChange={(e) => {
                    setEditForm({ ...editForm, endDate: e.target.value });
                  }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Time"
                  type="time"
                  required
                  fullWidth
                  value={editForm.endTime}
                  onChange={(e) => {
                    setEditForm({ ...editForm, endTime: e.target.value });
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <TextField
                label="Max Volunteers"
                type="number"
                fullWidth
                value={editForm.maxVolunteers}
                onChange={(e) => {
                  setEditForm({ ...editForm, maxVolunteers: e.target.value });
                }}
                inputProps={{ min: 1 }}
              />

              <FormControl fullWidth>
                <InputLabel id="edit-event-category-label">Category</InputLabel>
                <Select
                  labelId="edit-event-category-label"
                  label="Category"
                  value={editCategoryId}
                  onChange={(e) => {
                    setEditCategoryId(e.target.value as number | "");
                  }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {activeCategories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Autocomplete
                multiple
                options={catalogSkills}
                getOptionLabel={(o) => o.name}
                value={editSelectedSkills}
                onChange={(_, value) => {
                  setEditSelectedSkills(value);
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
                  />
                )}
              />

              <Autocomplete
                multiple
                options={catalogInterests}
                getOptionLabel={(o) => o.name}
                value={editSelectedInterests}
                onChange={(_, value) => {
                  setEditSelectedInterests(value);
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
                  />
                )}
              />

              {showDeleteConfirm ? (
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "error.main",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    Are you sure you want to delete &quot;{event?.title}
                    &quot;? This cannot be undone.
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      disabled={isMutating}
                      onClick={() => {
                        void handleDelete();
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button
                  color="error"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                  }}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Delete Event
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 3.5,
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            flexShrink: 0,
          }}
        >
          {mode === "view" ? (
            <>
              <Button onClick={onClose}>Close</Button>
              <Button
                onClick={handleEditClick}
                variant="contained"
                disabled={skillsLoading || loadingSkills || loadingInterests}
              >
                Edit Event
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setMode("view");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  void handleSave();
                }}
                variant="contained"
                disabled={isMutating}
              >
                Save
              </Button>
            </>
          )}
        </Box>
      </Box>
    </MobileDialog>
  );
}
