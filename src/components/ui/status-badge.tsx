import Chip from "@mui/material/Chip";
import type { SxProps, Theme } from "@mui/material/styles";
import type { JSX, ReactElement } from "react";

import type { RsvpStatus } from "@/components/volunteer/types";

type StatusBadgeProps = {
  label: string;
  color?: "success" | "warning" | "error" | "primary" | "secondary" | "default";
  icon?: ReactElement;
  size?: "small" | "medium";
  variant?: "filled" | "outlined";
  sx?: SxProps<Theme>;
};

export function StatusBadge({
  label,
  color = "default",
  icon,
  size = "small",
  variant = "filled",
  sx,
}: StatusBadgeProps): JSX.Element {
  return (
    <Chip
      label={label}
      color={color}
      icon={icon}
      size={size}
      variant={variant}
      sx={{ textTransform: "capitalize", ...sx }}
    />
  );
}

export function getRsvpStatusColor(
  status: RsvpStatus | string,
): "success" | "primary" | "error" | "warning" | "default" {
  switch (status) {
    case "confirmed": {
      return "primary";
    }
    case "attended": {
      return "success";
    }
    case "declined": {
      return "error";
    }
    case "pending": {
      return "warning";
    }
    case "no_show":
    case "cancelled": {
      return "default";
    }
    default: {
      return "default";
    }
  }
}

type HoursStatus = "pending" | "approved" | "rejected" | string;

export function getHoursStatusColor(
  status: HoursStatus,
): "success" | "warning" | "error" | "default" {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "error";
  return "default";
}

type BackgroundCheckStatus = "approved" | "pending" | "rejected" | string;

export function getBackgroundCheckColor(
  status: BackgroundCheckStatus,
): "success" | "warning" | "error" | "default" {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "error";
  return "default";
}

export function getBackgroundCheckLabel(status: BackgroundCheckStatus): string {
  const labels: Record<string, string> = {
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    not_required: "Not Required",
  };
  return labels[status] ?? status;
}
