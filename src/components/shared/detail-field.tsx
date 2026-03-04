import type { SxProps, Theme } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { type ReactElement, type ReactNode } from "react";

type DetailFieldProps = {
  label: string;
  value: ReactNode;
  valueSx?: SxProps<Theme>;
};

export function DetailField({
  label,
  value,
  valueSx,
}: DetailFieldProps): ReactElement {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.5 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={valueSx}>
        {value}
      </Typography>
    </Box>
  );
}
