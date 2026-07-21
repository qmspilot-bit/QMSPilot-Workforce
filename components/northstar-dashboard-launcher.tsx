"use client";

import { BarChart3 } from "lucide-react";

export function NorthstarDashboardLauncher() {
  return (
    <a
      href="/dashboard"
      aria-label="Open Northstar Accountability Dashboard"
      style={{
        position: "fixed",
        top: 70,
        right: 174,
        zIndex: 179,
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        minHeight: 44,
        padding: "0 16px",
        border: "1px solid #9bcab8",
        borderRadius: 999,
        color: "#123d31",
        background: "linear-gradient(135deg,#f2fff9,#dff6ec)",
        boxShadow: "0 14px 36px rgba(28,111,82,.18)",
        fontSize: 12,
        fontWeight: 850,
        textDecoration: "none",
      }}
    >
      <BarChart3 size={17} />
      Accountability
    </a>
  );
}
