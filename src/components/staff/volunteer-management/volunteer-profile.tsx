"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import EventIcon from "@mui/icons-material/Event";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HistoryIcon from "@mui/icons-material/History";
import PhoneIcon from "@mui/icons-material/Phone";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SecurityIcon from "@mui/icons-material/Security";
import StarIcon from "@mui/icons-material/Star";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WorkIcon from "@mui/icons-material/Work";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useEffect, useState } from "react";

import { ConfirmDialog, DetailField } from "@/components/shared";
import {
  getBackgroundCheckColor,
  getBackgroundCheckLabel,
  getRsvpStatusColor,
  StatusBadge,
} from "@/components/ui";
import { useHours } from "@/hooks/use-hours";
import { useVolunteerDetail } from "@/hooks/use-volunteer-detail";
import { useVolunteerTypes } from "@/hooks/use-volunteer-types";
import type { FetchVolunteerByIdResult } from "@/services/volunteer-client.service";

import SkillsModal from "./skills-modal";

/**
 * VolunteerProfile
 *
 * Displays complete volunteer information including personal details, status,
 * availability, and account history. Used in both modal and page contexts.
 */
type VolunteerProfileProps = {
  volunteer: FetchVolunteerByIdResult;
  onDelete?: () => void;
  onVolunteerUpdated?: () => void;
  /** Defaults to staff. */
  viewerRole?: "volunteer" | "staff";
};

function formatStaffTime(hhmm: string): string {
  const parts = hhmm.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    console.error("[formatStaffTime] Invalid time string:", hhmm);
    return hhmm;
  }
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return m === 0
    ? `${hour} ${period}`
    : `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function VolunteerProfile({
  volunteer,
  onDelete,
  onVolunteerUpdated,
  viewerRole = "staff",
}: VolunteerProfileProps): JSX.Element {
  const { volunteers: vol, users: user } = volunteer;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [skillsModalMode, setSkillsModalMode] = useState<
    "skills" | "interests"
  >("skills");

  const [hoursDeleteTargetId, setHoursDeleteTargetId] = useState<number | null>(
    null,
  );
  const [hoursActionLoading, setHoursActionLoading] = useState<number | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { enqueueSnackbar } = useSnackbar();
  const { approveHours, rejectHours, deleteHours } = useHours();
  const { updateVolunteer, deleteVolunteer } = useVolunteerDetail();

  const canActOnHours = viewerRole !== "volunteer";

  const handleApproveHours = useCallback(
    async (hoursId: number): Promise<void> => {
      setHoursActionLoading(hoursId);
      const result = await approveHours(hoursId);
      if (result) {
        enqueueSnackbar("Hours approved", { variant: "success" });
        if (onVolunteerUpdated) onVolunteerUpdated();
      } else {
        enqueueSnackbar("Failed to approve hours", { variant: "error" });
      }
      setHoursActionLoading(null);
    },
    [approveHours, enqueueSnackbar, onVolunteerUpdated],
  );

  const handleRejectConfirm = useCallback(async (): Promise<void> => {
    if (rejectTarget === null) return;
    const id = rejectTarget;
    setHoursActionLoading(id);
    const result = await rejectHours(id, rejectReason || undefined);
    if (result) {
      enqueueSnackbar("Hours rejected", { variant: "success" });
      setRejectTarget(null);
      setRejectReason("");
      if (onVolunteerUpdated) onVolunteerUpdated();
    } else {
      enqueueSnackbar("Failed to reject hours", { variant: "error" });
    }
    setHoursActionLoading(null);
  }, [
    rejectTarget,
    rejectReason,
    rejectHours,
    enqueueSnackbar,
    onVolunteerUpdated,
  ]);

  const handleDeleteHoursConfirm = useCallback(async (): Promise<void> => {
    if (hoursDeleteTargetId == null) return;
    const id = hoursDeleteTargetId;
    setHoursDeleteTargetId(null);
    setHoursActionLoading(id);
    const success = await deleteHours(id);
    if (success) {
      enqueueSnackbar("Hours entry deleted", { variant: "success" });
      if (onVolunteerUpdated) onVolunteerUpdated();
    } else {
      enqueueSnackbar("Failed to delete hours entry", { variant: "error" });
    }
    setHoursActionLoading(null);
  }, [hoursDeleteTargetId, deleteHours, enqueueSnackbar, onVolunteerUpdated]);

  // ── Volunteer Edit / Delete ────────────────────────────────────────────────

  const handleEditVolunteer = useCallback(
    async (data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      bio?: string;
      isActive?: boolean;
      volunteerType?: string;
      isAlumni?: boolean;
      backgroundCheckStatus?:
        | "not_required"
        | "pending"
        | "approved"
        | "rejected";
      mediaRelease?: boolean;
      availability?: Record<string, unknown>;
      notificationPreference?: "email" | "sms" | "both" | "none";
    }): Promise<void> => {
      if (!vol.id) return;
      setSaving(true);
      const success = await updateVolunteer(vol.id, data);
      setSaving(false);
      if (success) {
        enqueueSnackbar("Volunteer updated successfully", {
          variant: "success",
        });
        setEditModalOpen(false);
        if (onVolunteerUpdated) onVolunteerUpdated();
      } else {
        enqueueSnackbar("Failed to update volunteer", { variant: "error" });
      }
    },
    [vol.id, updateVolunteer, enqueueSnackbar, onVolunteerUpdated],
  );

  const handleDeleteUser = useCallback(async (): Promise<void> => {
    if (!vol.id) return;
    setConfirmDelete(false);
    setDeleting(true);
    const success = await deleteVolunteer(vol.id);
    setDeleting(false);
    if (success) {
      enqueueSnackbar("Volunteer deleted successfully", { variant: "success" });
      if (onDelete) onDelete();
    } else {
      enqueueSnackbar("Failed to delete volunteer", { variant: "error" });
    }
  }, [vol.id, deleteVolunteer, enqueueSnackbar, onDelete]);

  if (!user) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">User information not found</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Stack spacing={2}>
        {/* Header Card with Profile */}
        <Card
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              display="flex"
              alignItems="center"
              gap={3}
              flexWrap={{ xs: "wrap", sm: "nowrap" }}
            >
              <Avatar
                alt={`${user.firstName} ${user.lastName}`}
                src={user.profilePicture || undefined}
                sx={{
                  width: 120,
                  height: 120,
                  border: 4,
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  fontSize: "3rem",
                }}
              >
                {!user.profilePicture && (
                  <>
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </>
                )}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }} noWrap>
                  {`${user.firstName} ${user.lastName}`}
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon sx={{ fontSize: 20, opacity: 0.9 }} />
                    <Typography variant="body1" sx={{ opacity: 0.95 }}>
                      {user.email}
                    </Typography>
                  </Box>
                  {user.phone && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon sx={{ fontSize: 20, opacity: 0.9 }} />
                      <Typography variant="body1" sx={{ opacity: 0.95 }}>
                        {user.phone}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>
            {user.bio && (
              <Box
                sx={{
                  mt: 3,
                  pt: 3,
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ opacity: 0.95, lineHeight: 1.6 }}
                >
                  {user.bio}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Status and Details Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gridTemplateRows: { xs: "auto", md: "1fr 1fr" },
            gap: 2,
            height: { md: "100%" },
          }}
        >
          {/* Volunteer Status - Top Left (1/3 width, 1/2 height) */}
          <Box
            sx={{
              gridColumn: { xs: "1", md: "1" },
              gridRow: { xs: "1", md: "1" },
            }}
          >
            <Card
              sx={{
                height: "100%",
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <WorkIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Volunteer Status
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.5, display: "block" }}
                    >
                      Volunteer Type
                    </Typography>
                    <Chip
                      label={vol.volunteerType || "Not specified"}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.5, display: "block" }}
                    >
                      Status
                    </Typography>
                    <StatusBadge
                      label={vol.isAlumni ? "Alumni" : "Active Volunteer"}
                      color={vol.isAlumni ? "secondary" : "success"}
                      icon={
                        vol.isAlumni ? undefined : (
                          <CheckCircleIcon fontSize="small" />
                        )
                      }
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.5, display: "block" }}
                    >
                      Background Check
                    </Typography>
                    <StatusBadge
                      label={getBackgroundCheckLabel(vol.backgroundCheckStatus)}
                      color={getBackgroundCheckColor(vol.backgroundCheckStatus)}
                      icon={<SecurityIcon fontSize="small" />}
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.5, display: "block" }}
                    >
                      Media Release
                    </Typography>
                    <StatusBadge
                      label={vol.mediaRelease ? "Approved" : "Not Approved"}
                      color={vol.mediaRelease ? "success" : "warning"}
                      icon={<DescriptionIcon fontSize="small" />}
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Total Hours - Top Middle (1/3 width, 1/2 height) */}
          <Box
            sx={{
              gridColumn: { xs: "1", md: "2" },
              gridRow: { xs: "2", md: "1" },
            }}
          >
            <Card
              sx={{
                height: "100%",
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AccessTimeIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Total Hours
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    color="primary"
                    sx={{ mb: 0.5 }}
                  >
                    {(volunteer.totalHours ?? 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hours volunteered
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Availability - Right Side (1/3 width, full height spanning 2 rows) */}
          <Box
            sx={{
              gridColumn: { xs: "1", md: "3" },
              gridRow: { xs: "3", md: "1 / 3" },
            }}
          >
            <Card
              sx={{
                height: "100%",
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CalendarTodayIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Availability
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={0.5}>
                  {vol.availability &&
                  typeof vol.availability === "object" &&
                  !Array.isArray(vol.availability) &&
                  Object.keys(vol.availability).length > 0 ? (
                    Object.entries(
                      vol.availability as Record<
                        string,
                        { start: string; end: string }[]
                      >,
                    )
                      .filter(
                        ([, ranges]) =>
                          Array.isArray(ranges) && ranges.length > 0,
                      )
                      .map(([day, ranges]) => (
                        <Box key={day} display="flex" gap={1}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ width: 90, flexShrink: 0 }}
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1)}:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {ranges
                              .map(
                                (r) =>
                                  `${formatStaffTime(r.start)} – ${formatStaffTime(r.end)}`,
                              )
                              .join(", ")}
                          </Typography>
                        </Box>
                      ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: "italic" }}
                    >
                      No availability specified
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Account Information - Bottom Left (2/3 width, 1/2 height) */}
          <Box
            sx={{
              gridColumn: { xs: "1", md: "1 / 3" },
              gridRow: { xs: "4", md: "2" },
            }}
          >
            <Card
              sx={{
                height: "100%",
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <HistoryIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Account Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 2,
                  }}
                >
                  <DetailField
                    label="Joined Date"
                    value={new Date(vol.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  />
                  <DetailField
                    label="Last Updated"
                    value={new Date(vol.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  />
                  <DetailField
                    label="Notification Preference"
                    value={
                      vol.notificationPreference === "none"
                        ? "Off"
                        : "On (Email)"
                    }
                  />
                  {user.emailVerifiedAt !== undefined && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Email Verification
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {user.emailVerifiedAt ? (
                          <>
                            <VerifiedUserIcon
                              fontSize="small"
                              color="success"
                            />
                            <Typography variant="body2" fontWeight={500}>
                              Verified{" "}
                              {new Date(
                                user.emailVerifiedAt,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <VerifiedUserIcon
                              fontSize="small"
                              color="warning"
                            />
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              color="text.secondary"
                            >
                              Not Verified
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Additional Sections */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {/* Onboarding Section */}
          <Box>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ p: 2.5, flex: 1 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AssignmentTurnedInIcon color="primary" />
                  <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                    Onboarding
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {volunteer.onboardingStatus ? (
                  <Stack spacing={1.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {volunteer.onboardingStatus.profileFilled ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedIcon
                          color="disabled"
                          fontSize="small"
                        />
                      )}
                      <Typography
                        variant="body2"
                        color={
                          volunteer.onboardingStatus.profileFilled
                            ? "text.primary"
                            : "text.secondary"
                        }
                      >
                        Profile Details
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {volunteer.onboardingStatus.availabilitySet ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedIcon
                          color="disabled"
                          fontSize="small"
                        />
                      )}
                      <Typography
                        variant="body2"
                        color={
                          volunteer.onboardingStatus.availabilitySet
                            ? "text.primary"
                            : "text.secondary"
                        }
                      >
                        Availability Requirements
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {volunteer.onboardingStatus.skillsAdded ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedIcon
                          color="disabled"
                          fontSize="small"
                        />
                      )}
                      <Typography
                        variant="body2"
                        color={
                          volunteer.onboardingStatus.skillsAdded
                            ? "text.primary"
                            : "text.secondary"
                        }
                      >
                        Skills Added
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {volunteer.onboardingStatus.interestsAdded ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedIcon
                          color="disabled"
                          fontSize="small"
                        />
                      )}
                      <Typography
                        variant="body2"
                        color={
                          volunteer.onboardingStatus.interestsAdded
                            ? "text.primary"
                            : "text.secondary"
                        }
                      >
                        Interests Added
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {volunteer.onboardingStatus.documentsCompleted ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedIcon
                          color="disabled"
                          fontSize="small"
                        />
                      )}
                      <Typography
                        variant="body2"
                        color={
                          volunteer.onboardingStatus.documentsCompleted
                            ? "text.primary"
                            : "text.secondary"
                        }
                      >
                        Documents (
                        {volunteer.onboardingStatus.documentProgress.responded}/
                        {volunteer.onboardingStatus.documentProgress.required})
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No onboarding data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Skills Section */}
          <Box>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <StarIcon color="primary" />
                  <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                    Skills
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSkillsModalMode("skills");
                      setSkillsModalOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {volunteer.skills && volunteer.skills.length > 0 ? (
                  <Stack spacing={1.5}>
                    {volunteer.skills.map((skill) => (
                      <Box key={skill.skillId}>
                        <Typography variant="body2" fontWeight={500}>
                          {skill.skillName || "Unknown Skill"}
                        </Typography>
                        {skill.skillCategory && (
                          <Typography variant="caption" color="text.secondary">
                            {skill.skillCategory}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No skills specified
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Interests Section */}
          <Box>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <FavoriteIcon color="primary" />
                  <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                    Interests
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSkillsModalMode("interests");
                      setSkillsModalOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {volunteer.interests && volunteer.interests.length > 0 ? (
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {volunteer.interests.map((interest) => (
                      <Chip
                        key={interest.interestId}
                        label={interest.interestName || "Unknown Interest"}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No interests specified
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Recent Activity Section */}
          <Box>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <EventIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Recent Activity
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {volunteer.recentOpportunities &&
                volunteer.recentOpportunities.length > 0 ? (
                  <Stack spacing={1.5}>
                    {volunteer.recentOpportunities.map((opp) => (
                      <Box key={opp.opportunityId}>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={0.5}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {opp.opportunityTitle || "Unknown Opportunity"}
                          </Typography>
                          <StatusBadge
                            label={opp.rsvpStatus}
                            color={getRsvpStatusColor(opp.rsvpStatus)}
                            sx={{ fontSize: "0.7rem" }}
                          />
                        </Box>
                        {opp.opportunityLocation && (
                          <Typography variant="caption" color="text.secondary">
                            {opp.opportunityLocation}
                          </Typography>
                        )}
                        {opp.opportunityStartDate && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {new Date(
                              opp.opportunityStartDate,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No recent activity
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Hours Breakdown Section */}
          <Box>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                {/* Header row */}
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AccessTimeIcon color="primary" />
                  <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                    Hours Breakdown
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {volunteer.hoursBreakdown &&
                volunteer.hoursBreakdown.length > 0 ? (
                  <Stack spacing={1.5}>
                    {volunteer.hoursBreakdown.map((entry) => {
                      const isPending = entry.status === "pending";
                      const isBusy = hoursActionLoading === entry.id;

                      return (
                        <Box key={entry.id}>
                          <Box
                            display="flex"
                            alignItems="flex-start"
                            justifyContent="space-between"
                            mb={0.5}
                            gap={1}
                          >
                            {/* Left: title + hours */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                mb={0.25}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={500}
                                  noWrap
                                  sx={{ flex: 1, mr: 1 }}
                                >
                                  {entry.opportunityTitle ||
                                    "Unknown Opportunity"}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="primary"
                                  sx={{ flexShrink: 0 }}
                                >
                                  {entry.hours.toFixed(2)} hrs
                                </Typography>
                              </Box>

                              {/* Date + status chip */}
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                flexWrap="wrap"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {new Date(entry.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </Typography>
                                {entry.status === "approved" && (
                                  <Chip
                                    label="Approved"
                                    size="small"
                                    color="success"
                                    icon={<CheckCircleIcon fontSize="small" />}
                                    sx={{ fontSize: "0.65rem", height: "18px" }}
                                  />
                                )}
                                {entry.status === "pending" && (
                                  <Chip
                                    label="Pending"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ fontSize: "0.65rem", height: "18px" }}
                                  />
                                )}
                                {entry.status === "rejected" && (
                                  <Chip
                                    label="Rejected"
                                    size="small"
                                    color="error"
                                    sx={{ fontSize: "0.65rem", height: "18px" }}
                                  />
                                )}
                                {entry.status === "rejected" &&
                                  entry.rejectionReason && (
                                    <Typography variant="caption" color="error">
                                      {entry.rejectionReason}
                                    </Typography>
                                  )}
                              </Box>
                            </Box>

                            {/* Right: action buttons */}
                            <Stack
                              direction="row"
                              spacing={0.25}
                              sx={{ flexShrink: 0 }}
                            >
                              {/* Approve — staff/admin only, pending rows only */}
                              {canActOnHours && isPending && (
                                <Tooltip title="Approve hours">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() =>
                                        void handleApproveHours(entry.id)
                                      }
                                      disabled={isBusy}
                                      sx={{ p: 0.5 }}
                                    >
                                      {isBusy ? (
                                        <CircularProgress size={14} />
                                      ) : (
                                        <CheckCircleIcon
                                          sx={{ fontSize: "1rem" }}
                                        />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}

                              {/* Reject — staff/admin only, pending rows only */}
                              {canActOnHours && isPending && (
                                <Tooltip title="Reject hours">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setRejectTarget(entry.id)}
                                      disabled={isBusy}
                                      sx={{ p: 0.5 }}
                                    >
                                      {isBusy ? (
                                        <CircularProgress size={14} />
                                      ) : (
                                        <CloseIcon sx={{ fontSize: "1rem" }} />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}

                              {/* Delete — hidden for approved rows */}
                              {entry.status !== "approved" && (
                                <Tooltip title="Delete entry">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="default"
                                      onClick={() =>
                                        setHoursDeleteTargetId(entry.id)
                                      }
                                      disabled={isBusy}
                                      sx={{ p: 0.5 }}
                                    >
                                      {isBusy ? (
                                        <CircularProgress size={14} />
                                      ) : (
                                        <DeleteOutlineIcon
                                          sx={{ fontSize: "1rem" }}
                                        />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No hours recorded
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          display="flex"
          gap={2}
          justifyContent="flex-end"
          flexWrap="wrap"
          sx={{ pt: 1 }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => setEditModalOpen(true)}
            sx={{ px: 3, py: 1.5 }}
          >
            Edit Profile
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmDelete(true)}
            sx={{ px: 3, py: 1.5 }}
          >
            Delete Volunteer
          </Button>
        </Box>
      </Stack>

      {/* Skills/Interests Assignment Modal */}
      <SkillsModal
        open={skillsModalOpen}
        onClose={() => setSkillsModalOpen(false)}
        volunteerId={vol.id}
        mode={skillsModalMode}
        currentSkills={
          volunteer.skills?.map((s) => ({
            skillId: s.skillId,
            proficiencyLevel: s.proficiencyLevel,
          })) || []
        }
        currentInterests={
          volunteer.interests?.map((i) => ({
            interestId: i.interestId,
          })) || []
        }
        onSaved={() => {
          if (onVolunteerUpdated) onVolunteerUpdated();
        }}
      />

      {/* Reject Hours Dialog */}
      <Dialog
        open={rejectTarget !== null}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reject Hours</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason (optional)"
            multiline
            rows={2}
            fullWidth
            sx={{ mt: 1 }}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectTarget(null);
              setRejectReason("");
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleRejectConfirm()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Volunteer"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            ? This action cannot be undone. The volunteer&apos;s account and all
            associated data will be permanently removed.
          </>
        }
        confirmLabel={deleting ? "Deleting..." : "Delete Volunteer"}
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteUser}
        onClose={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={hoursDeleteTargetId !== null}
        title="Delete Hours Entry"
        message="Are you sure you want to delete this hours entry? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDeleteHoursConfirm}
        onClose={() => setHoursDeleteTargetId(null)}
      />

      {/* Edit Volunteer Dialog */}
      <StaffEditVolunteerModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        volunteer={volunteer}
        onSave={handleEditVolunteer}
        saving={saving}
      />
    </Box>
  );
}

function StaffSectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      variant="caption"
      fontWeight={700}
      letterSpacing={0.8}
      color="text.secondary"
      sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
    >
      {children}
    </Typography>
  );
}

type StaffEditVolunteerModalProps = {
  open: boolean;
  onClose: () => void;
  volunteer: FetchVolunteerByIdResult;
  onSave: (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    bio?: string;
    isActive?: boolean;
    volunteerType?: string;
    isAlumni?: boolean;
    backgroundCheckStatus?:
      | "not_required"
      | "pending"
      | "approved"
      | "rejected";
    mediaRelease?: boolean;
    availability?: Record<string, unknown>;
    notificationPreference?: "email" | "sms" | "both" | "none";
  }) => Promise<void>;
  saving: boolean;
};

function StaffEditVolunteerModal({
  open,
  onClose,
  volunteer,
  onSave,
  saving,
}: StaffEditVolunteerModalProps): JSX.Element {
  const { volunteers: vol, users: user } = volunteer;
  const { activeTypes } = useVolunteerTypes();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    isActive: user?.isActive ?? true,
    volunteerType: vol.volunteerType || "",
    isAlumni: vol.isAlumni || false,
    mediaRelease: vol.mediaRelease || false,
  });

  // Re-sync form data whenever the modal opens or volunteer data changes
  useEffect(() => {
    if (!open) return;
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      isActive: user?.isActive ?? true,
      volunteerType: vol.volunteerType || "",
      isAlumni: vol.isAlumni || false,
      mediaRelease: vol.mediaRelease || false,
    });
  }, [open, volunteer]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      await onSave(formData);
    } catch (error) {
      console.error(
        "[StaffEditVolunteerModal] onSave rejected unexpectedly:",
        error,
      );
    }
  };

  const handleChange = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Volunteer Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={4} sx={{ mt: 2 }}>
            {/* ── Identity ─────────────────────────────────── */}
            <Box>
              <StaffSectionLabel>Identity</StaffSectionLabel>
              <Stack spacing={2}>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                  <TextField
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                    disabled={saving}
                    size="small"
                  />
                  <TextField
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
                    disabled={saving}
                    size="small"
                  />
                </Box>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  disabled={saving}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  disabled={saving}
                  size="small"
                  fullWidth
                />
              </Stack>
            </Box>

            {/* ── About Me ─────────────────────────────────── */}
            <Box>
              <StaffSectionLabel>About Me</StaffSectionLabel>
              <TextField
                label="Bio"
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                multiline
                rows={3}
                disabled={saving}
                size="small"
                fullWidth
              />
            </Box>

            {/* ── Role ─────────────────────────────────────── */}
            <Box>
              <StaffSectionLabel>Role</StaffSectionLabel>
              <FormControl fullWidth disabled={saving} size="small">
                <InputLabel>Volunteer Type</InputLabel>
                <Select
                  value={formData.volunteerType}
                  label="Volunteer Type"
                  onChange={(e) =>
                    handleChange("volunteerType", e.target.value)
                  }
                >
                  {activeTypes.map((t) => (
                    <MenuItem key={t.id} value={t.name}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* ── Account ──────────────────────────────────── */}
            <Box>
              <StaffSectionLabel>Account</StaffSectionLabel>
              <Stack>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) =>
                        handleChange("isActive", e.target.checked)
                      }
                      disabled={saving}
                    />
                  }
                  label="Account Active"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isAlumni}
                      onChange={(e) =>
                        handleChange("isAlumni", e.target.checked)
                      }
                      disabled={saving}
                    />
                  }
                  label="Alumni Status"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.mediaRelease}
                      onChange={(e) =>
                        handleChange("mediaRelease", e.target.checked)
                      }
                      disabled={saving}
                    />
                  }
                  label="Media Release Signed"
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
