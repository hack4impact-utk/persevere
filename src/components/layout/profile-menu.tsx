"use client";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Divider,
  ListItemIcon,
  MenuItem,
  Popover,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { JSX } from "react";

import { useSignOut } from "@/hooks/use-auth";

type ProfileMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  /**
   * Anchor origin for the popover. Defaults match the sidebar footer
   * placement (popover opens upward from a bottom-anchored trigger).
   */
  anchorOrigin?: React.ComponentProps<typeof Popover>["anchorOrigin"];
  transformOrigin?: React.ComponentProps<typeof Popover>["transformOrigin"];
};

/**
 * ProfileMenu
 *
 * Shared identity popover used by both the desktop sidebar footer and the
 * mobile top-bar profile avatar. Reads the active session and routes to the
 * correct portal's profile/settings pages.
 */
export default function ProfileMenu({
  anchorEl,
  open,
  onClose,
  anchorOrigin = { vertical: "top", horizontal: "center" },
  transformOrigin = { vertical: "bottom", horizontal: "center" },
}: ProfileMenuProps): JSX.Element {
  const router = useRouter();
  const { data: session } = useSession();
  const handleSignOut = useSignOut();

  const isVolunteer = session?.user?.role === "volunteer";
  const profileBase = isVolunteer ? "/volunteer/profile" : "/staff/profile";

  const go = (href: string): void => {
    onClose();
    router.push(href);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      marginThreshold={0}
      slotProps={{ paper: { sx: { width: 240, borderRadius: 2 } } }}
    >
      {session?.user?.email && (
        <>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              px: 2,
              pt: 1.5,
              pb: 0.75,
              color: "text.secondary",
              fontWeight: 600,
            }}
          >
            {session.user.email}
          </Typography>
          <Divider />
        </>
      )}
      <MenuItem onClick={() => go(profileBase)} sx={{ py: 1.25, gap: 1.5 }}>
        <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        Profile
      </MenuItem>
      <MenuItem
        onClick={() => go(`${profileBase}?tab=settings`)}
        sx={{ py: 1.25, gap: 1.5 }}
      >
        <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        Settings
      </MenuItem>
      <MenuItem
        onClick={() => {
          onClose();
          handleSignOut();
        }}
        sx={{ py: 1.25, gap: 1.5, color: "error.main" }}
      >
        <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        Sign Out
      </MenuItem>
    </Popover>
  );
}
