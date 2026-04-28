"use client";

import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { JSX, ReactNode } from "react";

import { PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/ui";
import { useCommunications } from "@/hooks/use-communications";
import { usePortalLabel } from "@/hooks/use-portal-label";
import {
  type PendingHoursEntry,
  type PendingRsvpEntry,
  type RecentActivityItem,
  useStaffDashboard,
} from "@/hooks/use-staff-dashboard";

// ── Inline SVG icons (22×22, colored via currentColor) ───────────────────────

function EventIcon(): JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ApprovalsIcon(): JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CampaignIcon(): JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9v6h4l5 5V4L7 9H3z" />
      <path d="M16 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}

function ActivityClockIcon(): JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function PinIcon(): JSX.Element {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function TinyCalIcon(): JSX.Element {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatOpportunityDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const datePart = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timePart = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Card section title: icon + h6 + divider ───────────────────────────────────

type CardSectionTitleProps = {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
};

function CardSectionTitle({
  icon,
  title,
  action,
}: CardSectionTitleProps): JSX.Element {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ color: "primary.main", display: "inline-flex" }}>
            {icon}
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Box>
        {action}
      </Box>
      <Divider sx={{ mb: 1.5 }} />
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

/** Staff dashboard with portal overview. */
export default function StaffDashboardPage(): JSX.Element {
  const { data: session } = useSession();
  const portalLabel = usePortalLabel();
  const { data, isLoading, error } = useStaffDashboard();
  const { communications } = useCommunications();

  const activeVolunteers = data?.activeVolunteers ?? 0;
  const totalVolunteerHours = data?.totalVolunteerHours ?? 0;
  const upcomingOpportunities = data?.upcomingOpportunities ?? 0;
  const pendingRsvps = data?.pendingRsvps ?? 0;
  const upcomingList = data?.upcomingList ?? [];
  const pendingHoursList: PendingHoursEntry[] = data?.pendingHoursList ?? [];
  const pendingRsvpsList: PendingRsvpEntry[] = data?.pendingRsvpsList ?? [];
  const recentActivity: RecentActivityItem[] = data?.recentActivity ?? [];

  type ApprovalItem =
    | {
        kind: "hours";
        key: string;
        volunteerName: string;
        volunteerId: number;
        detail: string;
      }
    | {
        kind: "rsvp";
        key: string;
        volunteerName: string;
        volunteerId: number;
        detail: string;
      };

  const approvalItems: ApprovalItem[] = [
    ...pendingHoursList.map((e) => ({
      kind: "hours" as const,
      key: `hours-${e.id}`,
      volunteerName: e.volunteerName,
      volunteerId: e.volunteerId,
      detail: `${e.hours} hrs · ${formatShortDate(e.date)}`,
    })),
    ...pendingRsvpsList.map((e) => ({
      kind: "rsvp" as const,
      key: `rsvp-${e.volunteerId}-${e.opportunityId}`,
      volunteerName: e.volunteerName,
      volunteerId: e.volunteerId,
      detail: e.opportunityTitle,
    })),
  ];

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statCards = [
    { label: "Active Volunteers", value: activeVolunteers },
    { label: "Volunteer Hours (MTD)", value: totalVolunteerHours },
    { label: "Upcoming Opportunities", value: upcomingOpportunities },
    { label: "Pending RSVPs", value: pendingRsvps },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        "& > *": { flexShrink: 0 },
        gap: 3,
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
      }}
    >
      {error && <Alert severity="error">{error}</Alert>}

      <PageHeader
        eyebrow={portalLabel}
        title={`${getGreeting()}, ${firstName}`}
        subtitle={todayLabel}
        actions={
          <>
            <Button variant="outlined" href="/staff/opportunities">
              New Opportunity
            </Button>
            <Button variant="contained" href="/staff/approvals">
              Log Hours
            </Button>
          </>
        }
      />

      {/* Stat cards — 4-col grid */}
      <Grid container spacing={2}>
        {statCards.map(({ label, value }) => (
          <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2, boxShadow: 1, height: "100%" }}>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  fontWeight={500}
                  sx={{
                    mb: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontSize: "0.8125rem",
                  }}
                >
                  {label}
                </Typography>
                <Typography variant="h3" fontWeight={800} color="primary.main">
                  {isLoading ? "—" : value.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Content section — left 2/3, right 1/3 */}
      <Grid container spacing={2.5} alignItems="stretch">
        {/* Left column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2.5} direction="column">
            {/* Upcoming Opportunities */}
            <Grid>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <CardSectionTitle
                    icon={<EventIcon />}
                    title="Upcoming Opportunities"
                    action={
                      <Button
                        variant="text"
                        size="small"
                        href="/staff/opportunities"
                      >
                        View all
                      </Button>
                    }
                  />
                  {isLoading || !data ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading…
                    </Typography>
                  ) : upcomingList.length === 0 ? (
                    <EmptyState message="No upcoming opportunities." />
                  ) : (
                    upcomingList.map((opp, idx) => (
                      <Box
                        key={opp.id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1.5fr 1fr",
                          alignItems: "center",
                          gap: 1.5,
                          py: 1.5,
                          borderTop:
                            idx === 0 ? "none" : "1px solid rgba(0,0,0,.08)",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="text.primary"
                          >
                            {opp.title}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mt: 0.25,
                              color: "text.secondary",
                            }}
                          >
                            <PinIcon />
                            <Typography variant="caption">
                              {opp.location}
                            </Typography>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            color: "text.secondary",
                          }}
                        >
                          <TinyCalIcon />
                          <Typography variant="body2">
                            {formatOpportunityDate(opp.startDate)}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Pending Approvals */}
            <Grid>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <CardSectionTitle
                    icon={<ApprovalsIcon />}
                    title="Pending Approvals"
                  />
                  {isLoading || !data ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading…
                    </Typography>
                  ) : approvalItems.length === 0 ? (
                    <EmptyState message="No pending approvals." />
                  ) : (
                    <Box sx={{ maxHeight: 220, overflowY: "auto" }}>
                      {approvalItems.map((item, idx) => (
                        <Box
                          key={item.key}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            py: 1.25,
                            borderTop:
                              idx === 0 ? "none" : "1px solid rgba(0,0,0,.08)",
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: "#e5edff",
                              color: "primary.main",
                              fontSize: 13,
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(item.volunteerName)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                                mb: 0.25,
                              }}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {item.volunteerName}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  px: 0.75,
                                  py: 0.125,
                                  borderRadius: 1,
                                  bgcolor:
                                    item.kind === "hours"
                                      ? "warning.light"
                                      : "primary.light",
                                  color:
                                    item.kind === "hours"
                                      ? "warning.dark"
                                      : "primary.dark",
                                  fontWeight: 600,
                                  lineHeight: 1.6,
                                  flexShrink: 0,
                                }}
                              >
                                {item.kind === "hours" ? "Hours" : "RSVP"}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.detail}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            href="/staff/approvals"
                            sx={{ flexShrink: 0 }}
                          >
                            Review
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={2.5} direction="column">
            {/* Announcements */}
            <Grid>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <CardSectionTitle
                    icon={<CampaignIcon />}
                    title="Announcements"
                  />
                  {communications.length === 0 ? (
                    <EmptyState message="No announcements." />
                  ) : (
                    <Stack spacing={0}>
                      {communications.map((comm, i) => (
                        <ButtonBase
                          key={comm.id}
                          component={NextLink}
                          href="/staff/communications"
                          sx={{
                            display: "block",
                            textAlign: "left",
                            width: "100%",
                            py: 1.5,
                            borderTop: i === 0 ? "none" : "1px solid",
                            borderColor: "divider",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="baseline"
                            gap={1}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="text.primary"
                            >
                              {comm.subject}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              flexShrink={0}
                            >
                              {new Date(comm.sentAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            mt={0.5}
                          >
                            by {comm.sender?.firstName} {comm.sender?.lastName}
                          </Typography>
                        </ButtonBase>
                      ))}
                    </Stack>
                  )}
                  <Box mt={2}>
                    <Link
                      component={NextLink}
                      href="/staff/communications"
                      variant="body2"
                      underline="hover"
                    >
                      View all announcements →
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activity */}
            <Grid>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <CardSectionTitle
                    icon={<ActivityClockIcon />}
                    title="Recent Activity"
                  />
                  {isLoading || !data ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading…
                    </Typography>
                  ) : recentActivity.length === 0 ? (
                    <EmptyState message="No recent activity." />
                  ) : (
                    recentActivity.map((item, idx) => (
                      <Box
                        key={`${item.type}-${item.timestamp}-${idx}`}
                        sx={{
                          display: "flex",
                          py: 1,
                          borderTop:
                            idx === 0 ? "none" : "1px solid rgba(0,0,0,.06)",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">{item.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatRelative(item.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
