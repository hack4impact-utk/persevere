"use client";

import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Typography,
} from "@mui/material";
import { JSX } from "react";

import { DetailField, MobileDialog, ModalTitleBar } from "@/components/shared";
import {
  getHoursStatusColor,
  getHoursStatusLabel,
  StatusBadge,
} from "@/components/ui";
import type { VolunteerHourEntry } from "@/hooks/use-volunteer-hours";

type Props = {
  open: boolean;
  entry: VolunteerHourEntry | null;
  onClose: () => void;
  onEdit: (entry: VolunteerHourEntry) => void;
};

export default function VolunteerHoursDetailModal({
  open,
  entry,
  onClose,
  onEdit,
}: Props): JSX.Element {
  if (!entry) return <></>;

  return (
    <MobileDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <ModalTitleBar title="Hours Entry" onClose={onClose} />
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <DetailField
            label="Opportunity"
            value={entry.opportunityTitle ?? "Unknown Opportunity"}
          />
          <DetailField
            label="Date"
            value={new Date(entry.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          <DetailField label="Hours" value={`${entry.hours.toFixed(2)} hrs`} />
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.5 }}
            >
              Status
            </Typography>
            <StatusBadge
              label={getHoursStatusLabel(entry.status)}
              color={getHoursStatusColor(entry.status)}
              sx={{ borderRadius: "100px" }}
            />
            {entry.status === "rejected" && entry.rejectionReason && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block", mt: 0.5 }}
              >
                {entry.rejectionReason}
              </Typography>
            )}
          </Box>
          <DetailField
            label="Notes"
            value={entry.notes ?? "No notes"}
            valueSx={
              entry.notes
                ? undefined
                : { color: "text.secondary", fontStyle: "italic" }
            }
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={() => {
            onEdit(entry);
            onClose();
          }}
        >
          Edit
        </Button>
      </DialogActions>
    </MobileDialog>
  );
}
