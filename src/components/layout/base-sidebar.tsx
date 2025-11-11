"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { JSX } from "react";

export type NavItem = {
  label: string;
  href: string;
};

type BaseSidebarProps = {
  title: string;
  navItems: NavItem[];
};

/**
 * BaseSidebar
 *
 * Reusable sidebar component. Configure with navigation items and title
 * to create role-specific sidebars (staff, admin, volunteer).
 */
export default function BaseSidebar({
  title,
  navItems,
}: BaseSidebarProps): JSX.Element {
  const pathname = usePathname();

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
      <nav aria-label={`${title} navigation`}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <li key={item.href} style={{ marginBottom: 6 }}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    display: "block",
                    padding: "8px 12px",
                    textDecoration: "none",
                    borderRadius: 8,
                    color: isActive ? "#111827" : "#374151",
                    background: isActive ? "#e5e7eb" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
