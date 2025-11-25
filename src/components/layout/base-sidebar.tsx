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

export default function BaseSidebar({
  title,
  navItems,
}: BaseSidebarProps): JSX.Element {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        padding: "2rem 1.25rem",
        background: "#f8fafc",
        borderRight: "1px solid #e2e8f0",
        boxSizing: "border-box",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "2rem",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <li key={item.href} style={{ marginBottom: 10 }}>
                <Link href={item.href} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0.7rem 1rem",
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#0f172a" : "#475569",
                      background: isActive ? "#e2e8f0" : "transparent",
                      borderLeft: isActive
                        ? "4px solid #0ea5e9"
                        : "4px solid transparent",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Footnote (optional aesthetic detail) */}
      <div
        style={{
          marginTop: "auto",
          fontSize: 13,
          color: "#94a3b8",
          paddingTop: "1rem",
          borderTop: "1px solid #e2e8f0",
          textAlign: "center",
        }}
      >
        Persevere © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
