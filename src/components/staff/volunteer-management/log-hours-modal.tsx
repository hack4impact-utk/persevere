"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { JSX, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { Opportunity } from "@/components/volunteer/types";
import { type LogHoursPayload, useHours } from "@/hooks/use-hours";
import { apiClient, AuthenticationError } from "@/lib/api-client";

const logHoursSchema = z.object({
  opportunityId: z.number({ message: "Please select an opportunity" }),
  date: z.string().min(1, "Date is required"),
  hours: z
    .number({ message: "Hours are required" })
    .positive("Hours must be greater than 0")
    .max(24, "Hours cannot exceed 24 in a single day"),
  notes: z.string().optional(),
});

type LogHoursFormValues = z.infer<typeof logHoursSchema>;

type LogHoursModalProps = {
  open: boolean;
  volunteerId: number;
  viewerRole?: "volunteer" | "staff";
  onClose: () => void;
  onSuccess: () => void;
};

export default function LogHoursModal({
  open,
  volunteerId,
  viewerRole,
  onClose,
  onSuccess,
}: LogHoursModalProps): JSX.Element {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);

  const { logHours, loading, error } = useHours();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogHoursFormValues>({
    resolver: zodResolver(logHoursSchema),
    defaultValues: {
      opportunityId: undefined,
      date: new Date().toISOString().split("T")[0],
      hours: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchOpportunities = async (): Promise<void> => {
      setLoadingOpps(true);
      try {
        const endpoint =
          viewerRole === "staff"
            ? "/api/staff/calendar/events"
            : "/api/volunteer/opportunities?limit=100&offset=0";

        const result = await apiClient.get<{
          data: Opportunity[];
          total: number;
        }>(endpoint);
        if (!cancelled) {
          setOpportunities(result.data);
        }
      } catch (error_) {
        if (cancelled) return;
        if (error_ instanceof AuthenticationError) {
          router.push("/auth/login");
          return;
        }
        enqueueSnackbar("Failed to load opportunities", { variant: "error" });
        setOpportunities([]);
      } finally {
        if (!cancelled) setLoadingOpps(false);
      }
    };

    void fetchOpportunities();

    return (): void => {
      cancelled = true;
    };
  }, [open, router, enqueueSnackbar, viewerRole]);

  const handleClose = (): void => {
    reset();
    onClose();
  };

  const onSubmit = async (values: LogHoursFormValues): Promise<void> => {
    const payload: LogHoursPayload = {
      opportunityId: values.opportunityId,
      date: values.date,
      hours: values.hours,
      notes: values.notes,
    };

    const result = await logHours(volunteerId, payload);
    if (result) {
      reset();
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Log Volunteer Hours</DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Controller
              name="opportunityId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Opportunity"
                  fullWidth
                  required
                  error={!!errors.opportunityId}
                  helperText={errors.opportunityId?.message}
                  disabled={loadingOpps}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value ?? ""}
                  InputProps={
                    loadingOpps
                      ? {
                          endAdornment: (
                            <CircularProgress size={18} sx={{ mr: 2 }} />
                          ),
                        }
                      : undefined
                  }
                >
                  {opportunities.length === 0 && !loadingOpps && (
                    <MenuItem disabled value="">
                      No opportunities found
                    </MenuItem>
                  )}
                  {opportunities.map((opp) => (
                    <MenuItem key={opp.id} value={opp.id}>
                      {opp.title}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Date"
                  type="date"
                  fullWidth
                  required
                  error={!!errors.date}
                  helperText={errors.date?.message}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: new Date().toISOString().split("T")[0] }}
                />
              )}
            />

            <Controller
              name="hours"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Hours"
                  type="number"
                  fullWidth
                  required
                  error={!!errors.hours}
                  helperText={
                    errors.hours?.message ?? "Decimals allowed (e.g. 1.5)"
                  }
                  inputProps={{ min: 0.25, max: 24, step: 0.25 }}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                    )
                  }
                  value={field.value ?? ""}
                />
              )}
            />

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Optional notes about your volunteer work..."
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
              )}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            {loading ? "Saving..." : "Log Hours"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
