"use client";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Avatar,
  ButtonBase,
  Divider,
  IconButton,
  ListItemIcon,
  MenuItem,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ReactElement, type ReactNode, useState } from "react";

import { useSignOut } from "@/hooks/use-auth";

import styles from "./base-sidebar.module.css";

export type NavItem = {
  label: string;
  href: string;
  icon?: ReactNode;
};

type BaseSidebarProps = {
  navItems: NavItem[];
};

function getSettingsRoute(role: string | undefined): string {
  if (role === "admin") return "/staff/settings";
  if (role === "staff") return "/staff/profile";
  return "/volunteer/profile";
}

export default function BaseSidebar({
  navItems,
}: BaseSidebarProps): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const getDashboardRoute = (): string => {
    if (pathname?.startsWith("/staff")) return "/staff/dashboard";
    if (pathname?.startsWith("/volunteer")) return "/volunteer/dashboard";
    return "/home";
  };

  const handleSignOut = useSignOut();
  const settingsRoute = getSettingsRoute(session?.user?.role);
  const popoverOpen = Boolean(anchorEl);

  const openPopover = (e: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(e.currentTarget);
  };
  const closePopover = (): void => setAnchorEl(null);

  const avatarEl = session?.user?.image ? (
    <Avatar
      alt={session.user.name ?? "User"}
      src={session.user.image}
      sx={{ width: 32, height: 32, flexShrink: 0 }}
    />
  ) : (
    <Avatar
      sx={{
        width: 32,
        height: 32,
        bgcolor: "rgba(255,255,255,0.2)",
        flexShrink: 0,
      }}
    >
      <PersonIcon fontSize="small" />
    </Avatar>
  );

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
    >
      {/* Header row: logo + collapse toggle */}
      <div
        className={`${styles.sidebarHeader} ${collapsed ? styles.sidebarHeaderCollapsed : ""}`}
      >
        {!collapsed && (
          <Link
            href={getDashboardRoute()}
            aria-label="Go to dashboard"
            style={{ display: "flex" }}
          >
            <Image
              src="/images/perseverelogo.png"
              alt="Persevere Logo"
              width={180}
              height={41}
              priority
            />
          </Link>
        )}
        <Tooltip
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          placement="right"
        >
          <IconButton
            size="small"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            sx={{
              color: "rgba(255,255,255,0.75)",
              "&:hover": {
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.12)",
              },
              ...(collapsed ? {} : { position: "absolute", right: "0.75rem" }),
            }}
          >
            {collapsed ? (
              <ChevronRightIcon fontSize="small" />
            ) : (
              <ChevronLeftIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className={styles.nav} aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          const itemEl = (
            <Link
              key={item.href}
              href={item.href}
              className={styles.link}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={[
                  isActive ? styles.navItemActive : styles.navItem,
                  collapsed ? styles.navItemCollapsed : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                {!collapsed && (
                  <span className={styles.label}>{item.label}</span>
                )}
              </div>
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.href} title={item.label} placement="right">
              {/* span needed so Tooltip can attach ref to a DOM element */}
              <span>{itemEl}</span>
            </Tooltip>
          ) : (
            itemEl
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Profile zone */}
      <div className={styles.bottomSection}>
        <Tooltip
          title={collapsed ? "Profile & settings" : ""}
          placement="right"
        >
          <ButtonBase
            onClick={openPopover}
            className={`${styles.profileZone} ${collapsed ? styles.profileZoneCollapsed : ""}`}
            aria-label="Open profile menu"
            aria-haspopup="true"
            aria-expanded={popoverOpen}
          >
            {avatarEl}
            {!collapsed && session?.user?.name && (
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  textAlign: "left",
                  ml: 1,
                }}
              >
                {session.user.name}
              </Typography>
            )}
          </ButtonBase>
        </Tooltip>
      </div>

      {/* Profile popover */}
      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
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
        <MenuItem
          onClick={() => {
            closePopover();
            router.push(settingsRoute);
          }}
          sx={{ py: 1.25, gap: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem
          onClick={() => {
            closePopover();
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
    </aside>
  );
}
