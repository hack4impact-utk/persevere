"use client";
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Badge,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { type JSX, type ReactNode, useState } from "react";

import { useIsMobile } from "@/hooks/use-is-mobile";

type FilterDrawerProps = {
  /**
   * Filter controls. Rendered inline (in a flex row) on desktop, stacked
   * vertically inside a bottom drawer on mobile.
   */
  children: ReactNode;
  /** Active filter count — drives the badge on the mobile trigger button. */
  activeFilterCount?: number;
  /** Optional clear-all action shown in the drawer footer. */
  onClear?: () => void;
  /** Title for the drawer header (default "Filters"). */
  title?: string;
};

/**
 * FilterDrawer
 *
 * Wraps a set of secondary filter controls (selects, date range pickers, etc).
 * On viewports ≥ md the children render inline, matching the existing inline
 * filter-bar pattern. On smaller viewports the children collapse behind a
 * single `[Filters (N)]` button that opens a bottom drawer containing the same
 * controls in a vertical stack.
 *
 * Search inputs should stay outside this wrapper — they belong inline at all
 * sizes since their value is the user's primary feedback signal while typing.
 */
export function FilterDrawer({
  children,
  activeFilterCount = 0,
  onClear,
  title = "Filters",
}: FilterDrawerProps): JSX.Element {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <>
      <Badge
        color="primary"
        badgeContent={activeFilterCount}
        invisible={activeFilterCount === 0}
        overlap="rectangular"
      >
        <Button
          variant="outlined"
          startIcon={<TuneIcon />}
          onClick={() => setOpen(true)}
          aria-label="Open filters"
        >
          Filters
        </Button>
      </Badge>

      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "85vh",
              pb: "env(safe-area-inset-bottom, 0px)",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            position: "sticky",
            top: 0,
            bgcolor: "background.paper",
            zIndex: 1,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <IconButton
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={2.5} sx={{ p: 2, pb: 3 }}>
          {children}
        </Stack>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            px: 2,
            py: 2,
            borderTop: 1,
            borderColor: "divider",
            position: "sticky",
            bottom: 0,
            bgcolor: "background.paper",
          }}
        >
          {onClear && (
            <Button variant="text" color="inherit" onClick={onClear} fullWidth>
              Clear all
            </Button>
          )}
          <Button variant="contained" onClick={() => setOpen(false)} fullWidth>
            Done
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
