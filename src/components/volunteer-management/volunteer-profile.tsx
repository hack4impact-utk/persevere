"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import EventIcon from "@mui/icons-material/Event";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HistoryIcon from "@mui/icons-material/History";
import PhoneIcon from "@mui/icons-material/Phone";
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
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { JSX, useCallback, useState } from "react";

import SkillsModal from "./skills-modal";
import type { FetchVolunteerByIdResult } from "./volunteer-service";

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
};

const getStatusColor = (
  status: string,
): "success" | "warning" | "error" | "default" => {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "error";
  return "default";
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    not_required: "Not Required",
  };
  return labels[status] || status;
};

export default function VolunteerProfile({
  volunteer,
  onDelete,
  onVolunteerUpdated,
}: VolunteerProfileProps): JSX.Element {
  const { volunteers: vol, users: user } = volunteer;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [skillsModalMode, setSkillsModalMode] = useState<
    "skills" | "interests"
  >("skills");
  const { enqueueSnackbar } = useSnackbar();

  const handleEditVolunteer = useCallback(async (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    bio?: string;
    isActive?: boolean;
    volunteerType?: string;
    isAlumni?: boolean;
    backgroundCheckStatus?: "not_required" | "pending" | "approved" | "rejected";
    mediaRelease?: boolean;
    availability?: Record<string, unknown>;
    notificationPreference?: "email" | "sms" | "both" | "none";
  }): Promise<void> => {
    if (!vol.id) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/staff/volunteers/${vol.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update volunteer");
      }

      enqueueSnackbar("Volunteer updated successfully", {
        variant: "success",
      });
      setEditModalOpen(false);
      // Trigger refresh by calling onDelete (which should be renamed to onUpdate)
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Failed to update volunteer:", error);
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to update volunteer",
        { variant: "error" },
      );
    } finally {
      setSaving(false);
    }
  }, [vol.id, enqueueSnackbar, onDelete]);

  const handleDeleteUser = useCallback(async (): Promise<void> => {
    if (!vol.id) return;

    const volunteerId = vol.id;
    setConfirmDelete(false);
    setDeleting(true);

    try {
      const response = await fetch(`/api/staff/volunteers/${volunteerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete volunteer");
      }

      enqueueSnackbar("Volunteer deleted successfully", {
        variant: "success",
      });
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Failed to delete volunteer:", error);
      enqueueSnackbar(
        error instanceof Error ? error.message : "Failed to delete volunteer",
        { variant: "error" },
      );
    } finally {
      setDeleting(false);
    }
  }, [vol.id, enqueueSnackbar, onDelete]);

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
                    {user.firstName[0]}
                    {user.lastName[0]}
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
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
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
                    <Chip
                      label={vol.isAlumni ? "Alumni" : "Active Volunteer"}
                      color={vol.isAlumni ? "secondary" : "success"}
                      size="small"
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
                    <Chip
                      label={getStatusLabel(vol.backgroundCheckStatus)}
                      color={getStatusColor(vol.backgroundCheckStatus)}
                      size="small"
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
                    <Chip
                      label={vol.mediaRelease ? "Approved" : "Not Approved"}
                      color={vol.mediaRelease ? "success" : "warning"}
                      size="small"
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
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
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
                    {(volunteer.totalHours ?? 0).toFixed(1)}
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
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
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
                <Box display="flex" gap={1} flexWrap="wrap">
                  {vol.availability && Array.isArray(vol.availability) ? (
                    (vol.availability as string[]).map((time: string) => (
                      <Chip
                        key={time}
                        label={time}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
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
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
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
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      Joined Date
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(vol.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      Last Updated
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(vol.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      Notification Preference
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      textTransform="capitalize"
                    >
                      {vol.notificationPreference}
                    </Typography>
                  </Box>
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
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {/* Skills Section */}
          <Box>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
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
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={0.5}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {skill.skillName || "Unknown Skill"}
                          </Typography>
                          <Chip
                            label={skill.proficiencyLevel}
                            size="small"
                            color={
                              skill.proficiencyLevel === "advanced"
                                ? "success"
                                : skill.proficiencyLevel === "intermediate"
                                  ? "warning"
                                  : "default"
                            }
                            sx={{
                              textTransform: "capitalize",
                              fontSize: "0.7rem",
                            }}
                          />
                        </Box>
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
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
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
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
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
                          <Chip
                            label={opp.rsvpStatus}
                            size="small"
                            color={
                              opp.rsvpStatus === "attended"
                                ? "success"
                                : opp.rsvpStatus === "confirmed"
                                  ? "primary"
                                  : opp.rsvpStatus === "declined"
                                    ? "error"
                                    : "default"
                            }
                            sx={{
                              textTransform: "capitalize",
                              fontSize: "0.7rem",
                            }}
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
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AccessTimeIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Hours Breakdown
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {volunteer.hoursBreakdown &&
                volunteer.hoursBreakdown.length > 0 ? (
                  <Stack spacing={1.5}>
                    {volunteer.hoursBreakdown.map((entry) => (
                      <Box key={entry.id}>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={0.5}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {entry.opportunityTitle || "Unknown Opportunity"}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="primary"
                          >
                            {entry.hours.toFixed(1)} hrs
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </Typography>
                          {entry.verifiedAt && (
                            <Chip
                              label="Verified"
                              size="small"
                              color="success"
                              icon={<CheckCircleIcon fontSize="small" />}
                              sx={{ fontSize: "0.65rem", height: "18px" }}
                            />
                          )}
                        </Box>
                      </Box>
                    ))}
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
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Edit Profile
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmDelete(true)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
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

      {/* Delete User Confirmation Dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete Volunteer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            ? This action cannot be undone. The volunteer's account and all
            associated data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Volunteer"}
          </Button>
        </DialogActions>
      </Dialog>

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
    backgroundCheckStatus?: "not_required" | "pending" | "approved" | "rejected";
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
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phone: user.phone || "",
    bio: user.bio || "",
    isActive: user.isActive ?? true,
    volunteerType: vol.volunteerType || "",
    isAlumni: vol.isAlumni || false,
    backgroundCheckStatus: vol.backgroundCheckStatus || "not_required",
    mediaRelease: vol.mediaRelease || false,
    notificationPreference: vol.notificationPreference || "email",
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await onSave(formData);
  };

  const handleChange = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Volunteer Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Name Fields */}
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
                disabled={saving}
              />
              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
                disabled={saving}
              />
            </Box>

            {/* Contact Information */}
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              disabled={saving}
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={saving}
            />

            {/* Bio */}
            <TextField
              label="Bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              multiline
              rows={3}
              disabled={saving}
            />

            {/* Status and Type */}
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <FormControl fullWidth disabled={saving}>
                <InputLabel>Volunteer Type</InputLabel>
                <Select
                  value={formData.volunteerType}
                  label="Volunteer Type"
                  onChange={(e) => handleChange("volunteerType", e.target.value)}
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="corporate">Corporate</MenuItem>
                  <MenuItem value="group">Group</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={saving}>
                <InputLabel>Background Check</InputLabel>
                <Select
                  value={formData.backgroundCheckStatus}
                  label="Background Check"
                  onChange={(e) =>
                    handleChange("backgroundCheckStatus", e.target.value)
                  }
                >
                  <MenuItem value="not_required">Not Required</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Notification Preference */}
            <FormControl fullWidth disabled={saving}>
              <InputLabel>Notification Preference</InputLabel>
              <Select
                value={formData.notificationPreference}
                label="Notification Preference"
                onChange={(e) =>
                  handleChange("notificationPreference", e.target.value)
                }
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="both">Both</MenuItem>
                <MenuItem value="none">None</MenuItem>
              </Select>
            </FormControl>

            {/* Boolean Toggles */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleChange("isActive", e.target.checked)}
                    disabled={saving}
                  />
                }
                label="Account Active"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAlumni}
                    onChange={(e) => handleChange("isAlumni", e.target.checked)}
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
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
