import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { type JSX, type ReactNode } from "react";

type AsyncContentProps = {
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
  empty?: boolean;
  children: ReactNode;
};

export function AsyncContent({
  loading,
  error,
  emptyMessage,
  empty = false,
  children,
}: AsyncContentProps): JSX.Element {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (empty && emptyMessage) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontStyle: "italic", py: 2 }}
      >
        {emptyMessage}
      </Typography>
    );
  }
  return <>{children}</>;
}
