"use client";
import Dialog, { type DialogProps } from "@mui/material/Dialog";
import type { JSX } from "react";

import { useIsMobile } from "@/hooks/use-is-mobile";

/**
 * MobileDialog
 *
 * Drop-in replacement for MUI `<Dialog>` that automatically goes full-screen
 * on viewports below the md breakpoint. Forwards every other prop.
 *
 * The theme already collapses the paper border-radius to 0 and applies
 * safe-area padding when `fullScreen` is true (see `MuiDialog.styleOverrides`),
 * so consumers just need to swap the import.
 *
 * Pass `fullScreen` explicitly to override (e.g. `fullScreen={false}` for
 * dialogs that should stay centered even on mobile).
 */
export function MobileDialog(props: DialogProps): JSX.Element {
  const isMobile = useIsMobile();
  const { fullScreen, ...rest } = props;
  return <Dialog fullScreen={fullScreen ?? isMobile} {...rest} />;
}
