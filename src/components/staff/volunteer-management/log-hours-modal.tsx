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
import { useSnackbar } from "notistack";
import { JSX } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { type LogHoursPayload, useHours } from "@/hooks/use-hours";
import { useOpportunityOptions } from "@/hooks/use-opportunity-options";

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
  onClose: () => void;
  onSuccess: () => void;
};

export default function LogHoursModal({
  open,
  volunteerId,
  onClose,
  onSuccess,
}: LogHoursModalProps): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const { opportunities, loading: loadingOpps } = useOpportunityOptions(open);
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
    } else if (error) {
      enqueueSnackbar(error, { variant: "error" });
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
