import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { JSX, ReactElement, ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactElement;
  message: string;
  subMessage?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon,
  message,
  subMessage,
  action,
}: EmptyStateProps): JSX.Element {
  return (
    <Box sx={{ textAlign: "center", py: 4 }}>
      {icon && (
        <Box sx={{ mb: 1, color: "text.disabled", fontSize: 64 }}>{icon}</Box>
      )}
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      {subMessage && (
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
          {subMessage}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
