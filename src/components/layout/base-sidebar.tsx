"use client";
import { title } from "node:process";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";

import styles from "./base-sidebar.module.css";

export type NavItem = {
  label: string;
  href: string;
  icon?: ReactNode; // optional, so your existing navItems still type-check
};

type BaseSidebarProps = {
  navItems: NavItem[];
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function BaseSidebar({ navItems }: BaseSidebarProps) {
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
    <aside
      style={{
        width: 240,
        borderRight: "1px solid #e5e7eb",
        padding: 16,
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        height: "100vh",
        background: "#fafafa",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 18 }}>
        {title}
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
