"use client";

import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Chip, Tab, Tabs } from "@mui/material";
import { useSnackbar } from "notistack";
import { JSX, SyntheticEvent, useCallback, useState } from "react";

import { PageHeader } from "@/components/shared";
import { useApprovalsAttendance } from "@/hooks/use-approvals-attendance";
import { useApprovalsHours } from "@/hooks/use-approvals-hours";
import { useApprovalsRsvps } from "@/hooks/use-approvals-rsvps";

import AttendanceTab from "./attendance-tab";
import HoursTab from "./hours-tab";
import LogHoursModal from "./log-hours-modal";
import RsvpsTab from "./rsvps-tab";

export default function ApprovalsPage(): JSX.Element {
  const [tab, setTab] = useState(0);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const hoursHook = useApprovalsHours();
  const rsvpsHook = useApprovalsRsvps();
  const attendanceHook = useApprovalsAttendance();

  const handleTabChange = (_: SyntheticEvent, newValue: number): void => {
    setTab(newValue);
  };

  const handleLogHours = useCallback(
    async (
      input: Parameters<typeof hoursHook.logHour>[0],
    ): Promise<boolean> => {
      const ok = await hoursHook.logHour(input);
      if (ok)
        enqueueSnackbar("Hours logged successfully", { variant: "success" });
      return ok;
    },
    [hoursHook, enqueueSnackbar],
  );

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <PageHeader
        eyebrow="Staff Portal"
        title="Approvals"
        subtitle="Review volunteer submissions and applications"
        actions={
          tab === 0 ? (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setLogModalOpen(true)}
            >
              Log Hours
            </Button>
          ) : undefined
        }
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tab} onChange={handleTabChange}>
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Hours
                  {!hoursHook.loading && hoursHook.hours.length > 0 && (
                    <Chip
                      label={hoursHook.hours.length}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.7rem",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  RSVPs
                  {!rsvpsHook.loading && rsvpsHook.rsvps.length > 0 && (
                    <Chip
                      label={rsvpsHook.rsvps.length}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.7rem",
                        backgroundColor: "primary.main",
                        color: "white",
                      }}
                    />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Attendance
                  {!attendanceHook.loadingEvents &&
                    attendanceHook.events.some((e) => e.confirmedCount > 0) && (
                      <Chip
                        label={
                          attendanceHook.events.filter(
                            (e) => e.confirmedCount > 0,
                          ).length
                        }
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.7rem",
                          backgroundColor: "primary.main",
                          color: "white",
                        }}
                      />
                    )}
                </Box>
              }
            />
          </Tabs>
        </Box>
      </PageHeader>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        {tab === 0 && (
          <HoursTab
            hours={hoursHook.hours}
            loading={hoursHook.loading}
            mutating={hoursHook.mutating}
            onApprove={hoursHook.approveHour}
            onReject={hoursHook.rejectHour}
          />
        )}
        {tab === 1 && (
          <RsvpsTab
            rsvps={rsvpsHook.rsvps}
            loading={rsvpsHook.loading}
            mutating={rsvpsHook.mutating}
            onConfirm={rsvpsHook.confirmRsvp}
            onDecline={rsvpsHook.declineRsvp}
          />
        )}
        {tab === 2 && (
          <AttendanceTab
            events={attendanceHook.events}
            loading={attendanceHook.loadingEvents}
            eventRsvps={attendanceHook.eventRsvps}
            loadingRsvps={attendanceHook.loadingRsvps}
            mutating={attendanceHook.mutating}
            onLoadEventRsvps={attendanceHook.loadEventRsvps}
            onMark={attendanceHook.markAttendance}
          />
        )}
      </Box>

      <LogHoursModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        onSubmit={handleLogHours}
        submitting={hoursHook.mutating}
      />
    </Box>
  );
}
