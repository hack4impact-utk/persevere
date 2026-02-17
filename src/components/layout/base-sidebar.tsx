"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactElement, type ReactNode } from "react";

import styles from "./base-sidebar.module.css";

export type NavItem = {
  label: string;
  href: string;
  icon?: ReactNode; // optional, so your existing navItems still type-check
};

type BaseSidebarProps = {
  navItems: NavItem[];
};

export default function BaseSidebar({
  navItems,
}: BaseSidebarProps): ReactElement {
  const pathname = usePathname();

  // Determine dashboard route based on current pathname
  const getDashboardRoute = (): string => {
    if (pathname?.startsWith("/staff")) {
      return "/staff/dashboard";
    }
    if (pathname?.startsWith("/volunteer")) {
      return "/volunteer/dashboard";
    }
    return "/home"; // fallback
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo row */}
      <div className={styles.logo}>
        <Link href={getDashboardRoute()} aria-label="Go to dashboard">
          <Image
            src="/images/perseverelogo.png"
            alt="Persevere Logo"
            width={220}
            height={50}
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className={styles.nav} aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={styles.link}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={isActive ? styles.navItemActive : styles.navItem}>
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.label}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
