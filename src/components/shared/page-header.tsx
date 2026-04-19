import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { JSX, ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode; // For tabs or other lower content
};

/**
 * Shared page header component with standard typography and spacing.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: PageHeaderProps): JSX.Element {
  return (
    <Box sx={{ pb: 3 }}>
      {eyebrow && (
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.5,
            fontWeight: 600,
            color: "text.secondary",
            display: "block",
            mb: 0.5,
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "flex-end" }}
        gap={2}
      >
        <Box flex={1} minWidth={0}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 500,
              color: "text.primary",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box flexShrink={0} sx={{ display: "flex", gap: 1 }}>
            {actions}
          </Box>
        )}
      </Stack>
      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </Box>
  );
}
