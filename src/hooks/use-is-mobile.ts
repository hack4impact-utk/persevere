import type { Theme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/**
 * True when viewport is below the md breakpoint (< 900px).
 * Use for conditional rendering / branching logic. For pure styling,
 * prefer `sx={{ xs: ..., md: ... }}` breakpoint objects.
 */
export const useIsMobile = (): boolean =>
  useMediaQuery((t: Theme) => t.breakpoints.down("md"));

/**
 * True when viewport is below the sm breakpoint (< 600px) — phone portrait.
 */
export const useIsCompact = (): boolean =>
  useMediaQuery((t: Theme) => t.breakpoints.down("sm"));
