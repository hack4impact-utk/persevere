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
 *
 * On mobile (`xs`), the action slot stretches to full width and stacks
 * below the title. The title scales down to `h5` so it fits comfortably
 * on a 360-px viewport without truncation.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: PageHeaderProps): JSX.Element {
  return (
    <Box sx={{ pb: { xs: 2, md: 3 } }}>
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
        alignItems={{ xs: "stretch", sm: "flex-end" }}
        gap={2}
      >
        <Box flex={1} minWidth={0}>
          <Typography
            sx={{
              fontWeight: 500,
              color: "text.primary",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              fontSize: { xs: "1.5rem", sm: "2.125rem" },
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
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
              "& > *": { width: { xs: "100%", sm: "auto" } },
            }}
          >
            {actions}
          </Box>
        )}
      </Stack>
      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </Box>
  );
}
