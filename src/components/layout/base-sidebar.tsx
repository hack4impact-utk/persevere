"use client";
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

  return (
    <aside className={styles.sidebar}>
      {/* Logo row */}
      <div className={styles.logo}>
        <Image
          src="/images/perseverelogo.png"
          alt="Persevere Logo"
          width={140}
          height={32}
        />
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
