"use client";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  ButtonBase,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { type JSX, type ReactElement, type ReactNode, useState } from "react";

import { useIsMobile } from "@/hooks/use-is-mobile";

import styles from "./base-sidebar.module.css";
import ProfileMenu from "./profile-menu";

export type NavItem = {
  label: string;
  href: string;
  icon?: ReactNode;
};

type BaseSidebarProps = {
  navItems: NavItem[];
  /** When true (mobile), the sidebar renders inside a temporary Drawer. */
  mobileOpen?: boolean;
  /** Called when the drawer should close (backdrop click or nav-item tap). */
  onMobileClose?: () => void;
};

export default function BaseSidebar({
  navItems,
  mobileOpen = false,
  onMobileClose,
}: BaseSidebarProps): ReactElement {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              bgcolor: "primary.main",
              color: "common.white",
              pt: "env(safe-area-inset-top, 0px)",
              pb: "env(safe-area-inset-bottom, 0px)",
            },
          },
        }}
      >
        <SidebarContents
          navItems={navItems}
          collapsed={false}
          onNavClick={onMobileClose}
        />
      </Drawer>
    );
  }

  return <DesktopSidebar navItems={navItems} />;
}

function DesktopSidebar({ navItems }: { navItems: NavItem[] }): ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
    >
      <SidebarContents
        navItems={navItems}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
      />
    </aside>
  );
}

type SidebarContentsProps = {
  navItems: NavItem[];
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavClick?: () => void;
};

function SidebarContents({
  navItems,
  collapsed,
  onToggleCollapsed,
  onNavClick,
}: SidebarContentsProps): JSX.Element {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const dashboardHref = pathname?.startsWith("/staff")
    ? "/staff/dashboard"
    : pathname?.startsWith("/volunteer")
      ? "/volunteer/dashboard"
      : "/home";

  const avatar = session?.user?.image ? (
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
    <>
      {/* Header row: logo + collapse toggle (collapse only on desktop) */}
      <div
        className={`${styles.sidebarHeader} ${collapsed ? styles.sidebarHeaderCollapsed : ""}`}
      >
        {!collapsed && (
          <Link
            href={dashboardHref}
            aria-label="Go to dashboard"
            style={{ display: "flex" }}
            onClick={onNavClick}
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
        {onToggleCollapsed && (
          <Tooltip
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            placement="right"
          >
            <IconButton
              size="small"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              sx={{
                color: "rgba(255,255,255,0.75)",
                "&:hover": {
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.12)",
                },
                ...(collapsed
                  ? {}
                  : { position: "absolute", right: "0.75rem" }),
              }}
            >
              {collapsed ? (
                <ChevronRightIcon fontSize="small" />
              ) : (
                <ChevronLeftIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
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
              onClick={onNavClick}
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
              <span>{itemEl}</span>
            </Tooltip>
          ) : (
            itemEl
          );
        })}
      </nav>

      <Box sx={{ flex: 1 }} />

      {/* Profile zone */}
      <div className={styles.bottomSection}>
        <Tooltip
          title={collapsed ? "Profile & settings" : ""}
          placement="right"
        >
          <ButtonBase
            onClick={(e) => setAnchorEl(e.currentTarget)}
            className={`${styles.profileZone} ${collapsed ? styles.profileZoneCollapsed : ""}`}
            aria-label="Open profile menu"
            aria-haspopup="true"
            aria-expanded={Boolean(anchorEl)}
          >
            {avatar}
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

      <ProfileMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      />
    </>
  );
}
