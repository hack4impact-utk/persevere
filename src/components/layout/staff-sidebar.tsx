"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { JSX } from "react";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/staff/dashboard" },
  { label: "Volunteers", href: "/staff/volunteers" },
  { label: "Opportunities", href: "/staff/opportunities" },
  { label: "Reports", href: "/staff/reports" },
  { label: "Communications", href: "/staff/communications" },
];

export default function StaffSidebar(): JSX.Element {
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
        Staff
      </div>
      <nav aria-label="Staff navigation">
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
