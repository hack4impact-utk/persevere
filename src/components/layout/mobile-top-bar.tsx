"use client";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import { Avatar, Box, ButtonBase, IconButton } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { type JSX, useState } from "react";

import ProfileMenu from "./profile-menu";

type MobileTopBarProps = {
  onOpenNav: () => void;
};

/**
 * MobileTopBar
 *
 * Sticky app bar shown only on viewports below the md breakpoint.
 * Houses the hamburger (opens the sidebar drawer), the Persevere logo
 * (links back to the active portal's dashboard), and the profile avatar
 * (opens the shared ProfileMenu popover).
 */
export default function MobileTopBar({
  onOpenNav,
}: MobileTopBarProps): JSX.Element {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const dashboardHref = pathname?.startsWith("/staff")
    ? "/staff/dashboard"
    : pathname?.startsWith("/volunteer")
      ? "/volunteer/dashboard"
      : "/home";

  return (
    <Box
      component="header"
      sx={{
        display: { xs: "flex", md: "none" },
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        pt: "env(safe-area-inset-top, 0px)",
        px: 1,
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <IconButton
        onClick={onOpenNav}
        aria-label="Open navigation"
        sx={{
          color: "inherit",
          "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
        }}
      >
        <MenuIcon />
      </IconButton>

      <Link
        href={dashboardHref}
        aria-label="Go to dashboard"
        style={{ display: "flex", alignItems: "center", height: 40 }}
      >
        <Image
          src="/images/perseverelogo.png"
          alt="Persevere"
          width={132}
          height={30}
          priority
        />
      </Link>

      <ButtonBase
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Open profile menu"
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
        sx={{
          minWidth: 44,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
        }}
      >
        {session?.user?.image ? (
          <Avatar
            alt={session.user.name ?? "User"}
            src={session.user.image}
            sx={{ width: 32, height: 32 }}
          />
        ) : (
          <Avatar
            sx={{ width: 32, height: 32, bgcolor: "rgba(255,255,255,0.2)" }}
          >
            <PersonIcon fontSize="small" />
          </Avatar>
        )}
      </ButtonBase>

      <ProfileMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      />
    </Box>
  );
}
