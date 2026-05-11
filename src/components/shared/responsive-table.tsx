"use client";
import { Box } from "@mui/material";
import { type JSX, type ReactNode } from "react";

import { useIsMobile } from "@/hooks/use-is-mobile";

type ResponsiveTableProps = {
  /** Rendered when viewport is at md or wider. Typically a `<Table>`. */
  desktop: ReactNode;
  /** Rendered below md. Typically a vertical stack of cards. */
  mobile: ReactNode;
};

/**
 * ResponsiveTable
 *
 * Branches between a desktop table view and a mobile card-list view at the
 * md breakpoint. The component itself is intentionally thin — it does not
 * own loading or empty states; consumers provide those inside the slot they
 * pass. This keeps the per-page table semantics (sticky header, fixed
 * heights, overlay spinners) intact on desktop while letting mobile use a
 * looser card-stack layout.
 *
 * @example
 * <ResponsiveTable
 *   desktop={
 *     <Table stickyHeader>
 *       <TableHead>…</TableHead>
 *       <TableBody>{items.map(renderRow)}</TableBody>
 *     </Table>
 *   }
 *   mobile={
 *     <Stack gap={2} sx={{ p: 2 }}>
 *       {items.map(renderMobileCard)}
 *     </Stack>
 *   }
 * />
 */
export function ResponsiveTable({
  desktop,
  mobile,
}: ResponsiveTableProps): JSX.Element {
  const isMobile = useIsMobile();
  return (
    <Box
      sx={{
        width: "100%",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {isMobile ? mobile : desktop}
    </Box>
  );
}
