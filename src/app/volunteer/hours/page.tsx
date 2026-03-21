"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { JSX, useState } from "react";

import VolunteerHoursTable from "@/components/volunteer/volunteer-hours-table";
import VolunteerLogHoursModal from "@/components/volunteer/volunteer-log-hours-modal";
import { useVolunteerHours } from "@/hooks/use-volunteer-hours";

export default function HoursPage(): JSX.Element {
  const { hours, loading, isMutating, error, logHours, deleteHours } =
    useVolunteerHours();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 1, md: 1.5 }, pb: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" fontWeight={600}>
          My Hours
        </Typography>
        <Button variant="contained" onClick={() => setModalOpen(true)}>
          Log Hours
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <VolunteerHoursTable
        hours={hours}
        loading={loading}
        onDelete={deleteHours}
      />
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
