"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { JSX, useMemo, useState } from "react";

import { PageHeader } from "@/components/shared";
import VolunteerHoursTable from "@/components/volunteer/volunteer-hours-table";
import VolunteerLogHoursModal from "@/components/volunteer/volunteer-log-hours-modal";
import { useVolunteerDashboard } from "@/hooks/use-volunteer-dashboard";
import { useVolunteerHours } from "@/hooks/use-volunteer-hours";

export default function HoursPage(): JSX.Element {
  const { hours, loading, isMutating, error, logHours, deleteHours } =
    useVolunteerHours();
  const { data: dashboardData } = useVolunteerDashboard();
  const [modalOpen, setModalOpen] = useState(false);

  // Compute year at a glance data
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthlyHours = new Array(12).fill(0);

    for (const entry of hours) {
      if (entry.status !== "approved") continue;
      const d = new Date(entry.date);
      if (d.getFullYear() === currentYear) {
        monthlyHours[d.getMonth()] += Number(entry.hours) || 0;
      }
    }

    return monthlyHours;
  }, [hours]);

  const maxChartVal = Math.max(...chartData, 10); // set minimum scale to 10

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: 4,
      }}
    >
      <PageHeader
        eyebrow="Volunteer Portal"
        title="Hours Log"
        subtitle="Track your volunteer impact"
        actions={
          <Button variant="contained" onClick={() => setModalOpen(true)}>
            Log New Hours
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: 3, mb: 3 }}>
        {/* Stats Column */}
        <Card sx={{ borderRadius: 2, boxShadow: 2, display: "flex", flexDirection: "column" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, mb: 2, display: "block" }}>
              Verified Hours
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1, mb: 1 }}>
              {dashboardData?.verifiedHours ?? 0}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              approved all-time hours
            </Typography>

            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, mb: 2, display: "block" }}>
              Status summary
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Pending Approval</Typography>
              <Typography variant="body2" fontWeight={600}>{dashboardData?.pendingHours ?? 0} hr</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Chart Column */}
        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, mb: 2, display: "block" }}>
              Year at a glance
            </Typography>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 180, mt: 3 }}>
              {chartData.map((h, i) => {
                const heightPct = (h / maxChartVal) * 100;
                return (
                  <Box key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                    <Box sx={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%", justifyContent: "center" }}>
                      <Box
                        sx={{
                          width: "80%",
                          height: `${heightPct}%`,
                          minHeight: h > 0 ? "4px" : "0",
                          bgcolor: h > 0 ? "primary.main" : "grey.200",
                          borderRadius: "4px 4px 0 0",
                          transition: "height 0.3s",
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontSize: 10 }}>
                      {"JFMAMJJASOND"[i]}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ borderRadius: 2, boxShadow: 2, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <VolunteerHoursTable
          hours={hours}
          loading={loading}
          onDelete={deleteHours}
        />
      </Card>

      <VolunteerLogHoursModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
        logHours={logHours}
        isMutating={isMutating}
      />
    </Box>
  );
}
