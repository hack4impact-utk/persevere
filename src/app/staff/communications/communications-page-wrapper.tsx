"use client";

import { Box } from "@mui/material";
import { type ReactElement, useEffect } from "react";

import CommunicationsList from "@/components/communications/communications-list";

type CommunicationsPageWrapperProps = {
  userRole: "staff" | "admin";
};

/**
 * CommunicationsPageWrapper
 *
 * Client component wrapper that overrides the parent main element's overflow
 * to prevent page-level scrolling on the communications page.
 */
export default function CommunicationsPageWrapper({
  userRole,
}: CommunicationsPageWrapperProps): ReactElement {
  useEffect((): (() => void) | undefined => {
    // Find the parent main element and override its overflow and height
    const mainElement = document.querySelector("main");
    if (mainElement) {
      const mainEl = mainElement as HTMLElement;

      // Store original styles
      const originalOverflow = mainEl.style.overflow;
      const originalHeight = mainEl.style.height;
      const originalMaxHeight = mainEl.style.maxHeight;
      const originalOverflowY = mainEl.style.overflowY;
      const originalOverflowX = mainEl.style.overflowX;
      const originalDisplay = mainEl.style.display;

      // Prevent scrolling on the main element and ensure proper height
      mainEl.style.overflow = "hidden";
      mainEl.style.overflowY = "hidden";
      mainEl.style.overflowX = "hidden";
      mainEl.style.height = "100%";
      mainEl.style.maxHeight = "100%";
      // Ensure it's a flex container if it isn't already
      if (!mainEl.style.display || mainEl.style.display === "block") {
        mainEl.style.display = "flex";
        mainEl.style.flexDirection = "column";
      }

      // Cleanup: restore original styles when component unmounts
      return (): void => {
        mainEl.style.overflow = originalOverflow || "auto";
        mainEl.style.overflowY = originalOverflowY || "";
        mainEl.style.overflowX = originalOverflowX || "";
        mainEl.style.height = originalHeight || "";
        mainEl.style.maxHeight = originalMaxHeight || "";
        mainEl.style.display = originalDisplay || "";
      };
    }
    return undefined;
  }, []);

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <CommunicationsList userRole={userRole} />
    </Box>
  );
}
