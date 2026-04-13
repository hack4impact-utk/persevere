"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import DrawIcon from "@mui/icons-material/Draw";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PsychologyIcon from "@mui/icons-material/Psychology";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SecurityIcon from "@mui/icons-material/Security";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
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

import { ConfirmDialog, DetailField, ModalTitleBar } from "@/components/shared";
import {
  getBackgroundCheckColor,
  getBackgroundCheckLabel,
  LoadingSkeleton,
  StatusBadge,
} from "@/components/ui";
import { useVolunteerDetail } from "@/hooks/use-volunteer-detail";
import { useVolunteerTypes } from "@/hooks/use-volunteer-types";
import type {
  DocumentWithSignature,
  FetchVolunteerByIdResult,
} from "@/services/volunteer-client.service";

import SkillsModal from "./skills-modal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

function parseHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  action,
  children,
}: {
  icon: JSX.Element;
  title: string;
  action?: JSX.Element;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Card
      elevation={0}
      sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2.5}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: "grey.100",
              color: "text.secondary",
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="caption"
            fontWeight={700}
            letterSpacing={0.8}
            color="text.secondary"
            sx={{ textTransform: "uppercase", flex: 1 }}
          >
            {title}
          </Typography>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Box>
      <Typography
        variant="caption"
        fontWeight={700}
        letterSpacing={0.8}
        color="text.secondary"
        sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function AvailabilityGrid({
  availability,
}: {
  availability:
    | Record<string, { start: string; end: string }[]>
    | null
    | undefined;
}): JSX.Element {
  const DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;
  const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const DISPLAY_START = 6;
  const DISPLAY_SPAN = 18;

  const hasAny = DAYS.some((d) => (availability?.[d]?.length ?? 0) > 0);
  if (!hasAny) {
    return (
      <Typography variant="body2" color="text.disabled">
        No availability set.
      </Typography>
    );
  }

  return (
    <Box>
      <Box display="grid" sx={{ gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
        {SHORT.map((label) => (
          <Typography
            key={label}
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontSize: "0.65rem",
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
      <Box
        display="grid"
        sx={{ gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}
      >
        {DAYS.map((day) => {
          const ranges = availability?.[day] ?? [];
          return (
            <Box
              key={day}
              sx={{
                height: 120,
                bgcolor: "grey.50",
                borderRadius: 1,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {ranges.map((r, i) => {
                const sh = parseHMM(r.start);
                const eh = parseHMM(r.end);
                const top =
                  Math.max(0, (sh - DISPLAY_START) / DISPLAY_SPAN) * 100;
                const height = Math.min(
                  100 - top,
                  ((eh - sh) / DISPLAY_SPAN) * 100,
                );
                return (
                  <Box
                    key={i}
                    sx={{
                      position: "absolute",
                      top: `${top}%`,
                      height: `${height}%`,
                      left: 0,
                      right: 0,
                      bgcolor: "primary.main",
                      opacity: 0.75,
                      borderRadius: 0.5,
                    }}
                  />
                );
              })}
            </Box>
          );
        })}
      </Box>
      <Box display="flex" justifyContent="space-between" mt={0.5}>
        <Typography variant="caption" color="text.disabled" fontSize="0.6rem">
          6 AM
        </Typography>
        <Typography variant="caption" color="text.disabled" fontSize="0.6rem">
          12 PM
        </Typography>
        <Typography variant="caption" color="text.disabled" fontSize="0.6rem">
          12 AM
        </Typography>
      </Box>
    </Box>
  );
}

// ── StaffEditVolunteerModal ───────────────────────────────────────────────────

type EditData = {
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
};

function StaffEditVolunteerModal({
  open,
  onClose,
  volunteer,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  volunteer: FetchVolunteerByIdResult;
  onSave: (data: EditData) => Promise<void>;
  saving: boolean;
}): JSX.Element {
  const { volunteers: vol, users: user } = volunteer;
  const { activeTypes } = useVolunteerTypes();

  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    bio: user?.bio ?? "",
    isActive: user?.isActive ?? true,
    volunteerType: vol.volunteerType ?? "",
    isAlumni: vol.isAlumni ?? false,
    mediaRelease: vol.mediaRelease ?? false,
  });

  useEffect(() => {
    if (!open) return;
    setFormData({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      bio: user?.bio ?? "",
      isActive: user?.isActive ?? true,
      volunteerType: vol.volunteerType ?? "",
      isAlumni: vol.isAlumni ?? false,
      mediaRelease: vol.mediaRelease ?? false,
    });
  }, [open, volunteer]);

  const handleChange = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      await onSave(formData);
    } catch (error) {
      console.error("[StaffEditVolunteerModal] onSave rejected:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <ModalTitleBar title="Edit Volunteer Profile" onClose={onClose} />
        <DialogContent>
          <Stack spacing={4} sx={{ mt: 2 }}>
            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                letterSpacing={0.8}
                color="text.secondary"
                sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
              >
                Identity
              </Typography>
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

            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                letterSpacing={0.8}
                color="text.secondary"
                sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
              >
                About Me
              </Typography>
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

            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                letterSpacing={0.8}
                color="text.secondary"
                sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
              >
                Role
              </Typography>
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

            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                letterSpacing={0.8}
                color="text.secondary"
                sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
              >
                Account
              </Typography>
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

// ── StaffSignDocumentDialog ───────────────────────────────────────────────────

function actionLabel(actionType: string): string {
  if (actionType === "acknowledge") return "Mark as acknowledged";
  if (actionType === "consent") return "Mark as consented";
  return "Mark as signed";
}

function StaffSignDocumentDialog({
  doc,
  open,
  onClose,
  onSign,
  signing,
}: {
  doc: DocumentWithSignature | null;
  open: boolean;
  onClose: () => void;
  onSign: (documentId: number, consentGiven?: boolean) => Promise<void>;
  signing: boolean;
}): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      {doc && (
        <>
          <ModalTitleBar title={doc.title} onClose={onClose} />
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary">
              {doc.actionType === "consent"
                ? "Record whether this volunteer consented to or declined this document."
                : `Manually record that this volunteer has ${doc.actionType === "acknowledge" ? "acknowledged" : "signed"} this document (e.g. paper copy signed in person).`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={signing}>
              Cancel
            </Button>
            {doc.actionType === "consent" ? (
              <>
                <Button
                  variant="outlined"
                  disabled={signing}
                  onClick={() => void onSign(doc.id, false)}
                >
                  Mark as declined
                </Button>
                <Button
                  variant="contained"
                  disabled={signing}
                  onClick={() => void onSign(doc.id, true)}
                >
                  Mark as consented
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                disabled={signing}
                onClick={() => void onSign(doc.id)}
              >
                {signing ? "Saving…" : actionLabel(doc.actionType)}
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

type VolunteerOverviewTabProps = {
  volunteer: FetchVolunteerByIdResult;
  onVolunteerUpdated?: () => void;
  onDelete?: () => void;
};

export function VolunteerOverviewTab({
  volunteer,
  onVolunteerUpdated,
  onDelete,
}: VolunteerOverviewTabProps): JSX.Element {
  const { volunteers: vol, users: user } = volunteer;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [skillsModalMode, setSkillsModalMode] = useState<
    "skills" | "interests"
  >("skills");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [signDialogDoc, setSignDialogDoc] =
    useState<DocumentWithSignature | null>(null);
  const [signing, setSigning] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const { updateVolunteer, deleteVolunteer, signDocumentForVolunteer } =
    useVolunteerDetail();

  const handleEditVolunteer = useCallback(
    async (data: EditData): Promise<void> => {
      if (!vol.id) return;
      setSaving(true);
      const success = await updateVolunteer(vol.id, data);
      setSaving(false);
      if (success) {
        enqueueSnackbar("Volunteer updated successfully", {
          variant: "success",
        });
        setEditModalOpen(false);
        onVolunteerUpdated?.();
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
      onDelete?.();
    } else {
      enqueueSnackbar("Failed to delete volunteer", { variant: "error" });
    }
  }, [vol.id, deleteVolunteer, enqueueSnackbar, onDelete]);

  const handleSignDocument = useCallback(
    async (documentId: number, consentGiven?: boolean): Promise<void> => {
      if (!vol.id) return;
      setSigning(true);
      const success = await signDocumentForVolunteer(
        vol.id,
        documentId,
        consentGiven,
      );
      setSigning(false);
      if (success) {
        enqueueSnackbar("Document recorded successfully", {
          variant: "success",
        });
        setSignDialogDoc(null);
        onVolunteerUpdated?.();
      } else {
        enqueueSnackbar("Failed to record document", { variant: "error" });
      }
    },
    [vol.id, signDocumentForVolunteer, enqueueSnackbar, onVolunteerUpdated],
  );

  if (!user) {
    return <LoadingSkeleton variant="lines" />;
  }

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const volunteerTypeDisplay = vol.volunteerType
    ? vol.volunteerType.charAt(0).toUpperCase() + vol.volunteerType.slice(1)
    : "Volunteer";
  const totalHours = volunteer.totalHours ?? 0;
  const skills = volunteer.skills ?? [];
  const interests = volunteer.interests ?? [];

  return (
    <>
      {/* Hero Banner */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "grey.200",
          borderRadius: 2,
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box
          sx={{
            height: 120,
            background: "linear-gradient(135deg, #327bf7 0%, #1a4db5 100%)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            p: 2,
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<EditIcon />}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              color: "white",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setEditModalOpen(true)}
          >
            Edit profile
          </Button>
          <IconButton
            size="small"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            aria-label="Delete volunteer"
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              "&:hover": { bgcolor: "rgba(220,50,50,0.35)" },
              color: "white",
              backdropFilter: "blur(4px)",
            }}
          >
            {deleting ? (
              <CircularProgress size={16} sx={{ color: "white" }} />
            ) : (
              <DeleteIcon fontSize="small" />
            )}
          </IconButton>
        </Box>

        <CardContent sx={{ pt: 0, px: { xs: 2.5, md: 3.5 }, pb: 3 }}>
          <Box sx={{ mt: -6, mb: 1.5 }}>
            <Avatar
              src={user.profilePicture || undefined}
              sx={{
                width: 96,
                height: 96,
                bgcolor: "primary.dark",
                fontSize: "2rem",
                fontWeight: 700,
                border: "4px solid white",
              }}
            >
              {!user.profilePicture && initials(user.firstName, user.lastName)}
            </Avatar>
          </Box>
          <Typography variant="h5" fontWeight={700} mb={1.5}>
            {fullName || "—"}
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            <Chip
              label={volunteerTypeDisplay}
              size="small"
              sx={{ bgcolor: "primary.main", color: "white", fontWeight: 600 }}
            />
            <Chip
              icon={<AccessTimeIcon />}
              label={`${totalHours.toFixed(2)} hrs`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<PsychologyIcon />}
              label={`${skills.length} skills`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<FavoriteBorderIcon />}
              label={`${interests.length} interests`}
              size="small"
              variant="outlined"
            />
            {vol.isAlumni && (
              <Chip label="Alumni" size="small" color="secondary" />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Three-zone layout */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        {/* Sidebar */}
        <Box sx={{ width: { xs: "100%", md: "33.333%" }, flexShrink: 0 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 2,
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3} divider={<Divider />}>
                <SidebarCard title="Contact">
                  <Stack spacing={2}>
                    <DetailField label="Email" value={user.email} />
                    <DetailField label="Phone" value={user.phone ?? "—"} />
                  </Stack>
                </SidebarCard>

                <SidebarCard title="Status">
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Background Check
                      </Typography>
                      <StatusBadge
                        label={getBackgroundCheckLabel(
                          vol.backgroundCheckStatus,
                        )}
                        color={getBackgroundCheckColor(
                          vol.backgroundCheckStatus,
                        )}
                        icon={<SecurityIcon fontSize="small" />}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Media Release
                      </Typography>
                      <StatusBadge
                        label={vol.mediaRelease ? "Signed" : "Not signed"}
                        color={vol.mediaRelease ? "success" : "warning"}
                        icon={<DescriptionIcon fontSize="small" />}
                      />
                    </Box>
                  </Stack>
                </SidebarCard>

                <SidebarCard title="Notifications">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor:
                          vol.notificationPreference === "none"
                            ? "grey.400"
                            : "success.main",
                      }}
                    />
                    <Typography variant="body2">
                      {vol.notificationPreference === "none"
                        ? "Notifications off"
                        : vol.notificationPreference === "sms"
                          ? "SMS notifications on"
                          : vol.notificationPreference === "both"
                            ? "Email & SMS on"
                            : "Email notifications on"}
                    </Typography>
                  </Box>
                </SidebarCard>

                <SidebarCard title="About Me">
                  <Typography
                    variant="body2"
                    color={user.bio ? "text.secondary" : "text.disabled"}
                    sx={{ lineHeight: 1.75 }}
                  >
                    {user.bio ?? "No bio yet."}
                  </Typography>
                </SidebarCard>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Main content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={3}>
            {/* Onboarding Progress */}
            <SectionCard
              icon={<AssignmentTurnedInIcon sx={{ fontSize: 18 }} />}
              title="Onboarding Progress"
            >
              {volunteer.onboardingStatus ? (
                <>
                  <Box display="flex" justifyContent="flex-end" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      {volunteer.onboardingStatus.completionPercentage ?? 0}%
                      complete
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={volunteer.onboardingStatus.completionPercentage ?? 0}
                    sx={{ mb: 2, height: 6, borderRadius: 3 }}
                    color={
                      (volunteer.onboardingStatus.completionPercentage ?? 0) ===
                      100
                        ? "success"
                        : "primary"
                    }
                  />
                  <Stack spacing={1}>
                    {[
                      {
                        key: "profileFilled",
                        label: "Profile Details",
                        done: volunteer.onboardingStatus.profileFilled,
                      },
                      {
                        key: "availabilitySet",
                        label: "Availability Requirements",
                        done: volunteer.onboardingStatus.availabilitySet,
                      },
                      {
                        key: "skillsAdded",
                        label: "Skills Added",
                        done: volunteer.onboardingStatus.skillsAdded,
                      },
                      {
                        key: "interestsAdded",
                        label: "Interests Added",
                        done: volunteer.onboardingStatus.interestsAdded,
                      },
                    ].map(({ key, label, done }) => (
                      <Box key={key} display="flex" alignItems="center" gap={1}>
                        {done ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <RadioButtonUncheckedIcon
                            color="disabled"
                            fontSize="small"
                          />
                        )}
                        <Typography
                          variant="body2"
                          color={done ? "text.primary" : "text.secondary"}
                        >
                          {label}
                        </Typography>
                      </Box>
                    ))}

                    {/* Expandable Documents row */}
                    <Box>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() => setDocsExpanded((v) => !v)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            setDocsExpanded((v) => !v);
                        }}
                        aria-expanded={docsExpanded}
                      >
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
                          sx={{ flex: 1 }}
                        >
                          {`Documents (${volunteer.onboardingStatus.documentProgress.responded}/${volunteer.onboardingStatus.documentProgress.required})`}
                        </Typography>
                        <IconButton
                          size="small"
                          tabIndex={-1}
                          sx={{ p: 0 }}
                          aria-label={
                            docsExpanded
                              ? "Collapse documents"
                              : "Expand documents"
                          }
                        >
                          {docsExpanded ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>

                      <Collapse in={docsExpanded}>
                        <Box
                          sx={{
                            mt: 1.5,
                            ml: 3.5,
                            overflowY: "auto",
                            maxHeight: 260,
                          }}
                        >
                          {(volunteer.documentSignatures ?? []).length === 0 ? (
                            <Typography
                              variant="body2"
                              color="text.disabled"
                              sx={{ py: 1 }}
                            >
                              No documents configured.
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                              {(volunteer.documentSignatures ?? []).map(
                                (doc) => (
                                  <Box
                                    key={doc.id}
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                    sx={{
                                      py: 0.75,
                                      borderBottom: "1px solid",
                                      borderColor: "grey.100",
                                      "&:last-child": { borderBottom: "none" },
                                    }}
                                  >
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={0.75}
                                        flexWrap="wrap"
                                      >
                                        <Typography
                                          variant="body2"
                                          fontWeight={500}
                                          noWrap
                                        >
                                          {doc.title}
                                        </Typography>
                                        {doc.required && (
                                          <Chip
                                            label="Required"
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            sx={{
                                              height: 18,
                                              fontSize: "0.65rem",
                                            }}
                                          />
                                        )}
                                      </Box>
                                      {doc.signedAt ? (
                                        <Box
                                          display="flex"
                                          alignItems="center"
                                          gap={0.5}
                                          mt={0.25}
                                        >
                                          <CheckCircleIcon
                                            color="success"
                                            sx={{ fontSize: 12 }}
                                          />
                                          <Typography
                                            variant="caption"
                                            color="success.main"
                                          >
                                            {doc.actionType === "consent"
                                              ? doc.consentGiven
                                                ? `Consented · ${new Date(doc.signedAt).toLocaleDateString()}`
                                                : `Declined · ${new Date(doc.signedAt).toLocaleDateString()}`
                                              : doc.actionType === "acknowledge"
                                                ? `Acknowledged · ${new Date(doc.signedAt).toLocaleDateString()}`
                                                : `Signed · ${new Date(doc.signedAt).toLocaleDateString()}`}
                                          </Typography>
                                        </Box>
                                      ) : (
                                        <Typography
                                          variant="caption"
                                          color="text.disabled"
                                        >
                                          Not yet signed
                                        </Typography>
                                      )}
                                    </Box>
                                    {!doc.signedAt &&
                                      doc.actionType !== "informational" && (
                                        <Tooltip title="Manually record signature">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSignDialogDoc(doc);
                                            }}
                                            aria-label={`Record signature for ${doc.title}`}
                                          >
                                            <DrawIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                  </Box>
                                ),
                              )}
                            </Stack>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  </Stack>
                </>
              ) : (
                <Typography variant="body2" color="text.disabled">
                  No onboarding data available
                </Typography>
              )}
            </SectionCard>

            {/* Weekly Availability */}
            <SectionCard
              icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
              title="Weekly Availability"
            >
              <AvailabilityGrid
                availability={
                  vol.availability as
                    | Record<string, { start: string; end: string }[]>
                    | null
                    | undefined
                }
              />
            </SectionCard>

            {/* Skills */}
            <SectionCard
              icon={<PsychologyIcon sx={{ fontSize: 18 }} />}
              title="Skills"
              action={
                <IconButton
                  size="small"
                  onClick={() => {
                    setSkillsModalMode("skills");
                    setSkillsModalOpen(true);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              }
            >
              {skills.length === 0 ? (
                <Typography variant="body2" color="text.disabled">
                  No skills specified
                </Typography>
              ) : (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {skills.map((skill) => (
                    <Chip
                      key={skill.skillId}
                      label={skill.skillName ?? "Unknown"}
                      sx={{
                        bgcolor: "rgba(50, 123, 247, 0.08)",
                        color: "primary.dark",
                        fontWeight: 500,
                        fontSize: "0.8rem",
                        height: 28,
                        border: "1px solid rgba(50, 123, 247, 0.2)",
                      }}
                    />
                  ))}
                </Box>
              )}
            </SectionCard>

            {/* Interests */}
            <SectionCard
              icon={<FavoriteBorderIcon sx={{ fontSize: 18 }} />}
              title="Interests"
              action={
                <IconButton
                  size="small"
                  onClick={() => {
                    setSkillsModalMode("interests");
                    setSkillsModalOpen(true);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              }
            >
              {interests.length === 0 ? (
                <Typography variant="body2" color="text.disabled">
                  No interests specified
                </Typography>
              ) : (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {interests.map((interest) => (
                    <Chip
                      key={interest.interestId}
                      label={interest.interestName ?? "Unknown"}
                      sx={{
                        bgcolor: "rgba(50, 123, 247, 0.08)",
                        color: "primary.dark",
                        fontWeight: 500,
                        fontSize: "0.8rem",
                        height: 28,
                        border: "1px solid rgba(50, 123, 247, 0.2)",
                      }}
                    />
                  ))}
                </Box>
              )}
            </SectionCard>
          </Stack>
        </Box>
      </Box>

      {/* Modals */}
      <SkillsModal
        open={skillsModalOpen}
        onClose={() => setSkillsModalOpen(false)}
        volunteerId={vol.id}
        mode={skillsModalMode}
        currentSkills={skills.map((s) => ({
          skillId: s.skillId,
        }))}
        currentInterests={interests.map((i) => ({
          interestId: i.interestId,
        }))}
        onSaved={() => onVolunteerUpdated?.()}
      />

      <StaffEditVolunteerModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        volunteer={volunteer}
        onSave={handleEditVolunteer}
        saving={saving}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Volunteer"
        message={
          <>
            Are you sure you want to delete <strong>{fullName}</strong>? This
            action cannot be undone. The volunteer&apos;s account and all
            associated data will be permanently removed.
          </>
        }
        confirmLabel={deleting ? "Deleting..." : "Delete Volunteer"}
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDeleteUser}
        onClose={() => setConfirmDelete(false)}
      />

      <StaffSignDocumentDialog
        doc={signDialogDoc}
        open={signDialogDoc !== null}
        onClose={() => setSignDialogDoc(null)}
        onSign={handleSignDocument}
        signing={signing}
      />
    </>
  );
}
