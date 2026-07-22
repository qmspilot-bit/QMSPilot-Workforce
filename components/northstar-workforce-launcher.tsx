"use client";

import { Network } from "lucide-react";

export function NorthstarWorkforceLauncher() {
  return (
    <a
      href="/workforce-operations"
      aria-label="Open Northstar AI Workforce Operations Center"
      style={{
        position: "fixed",
        top: 70,
        right: 332,
        zIndex: 178,
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        minHeight: 44,
        padding: "0 16px",
        border: "1px solid #91bfe8",
        borderRadius: 999,
        color: "#0d3e68",
        background: "linear-gradient(135deg,#f1f8ff,#dceeff)",
        boxShadow: "0 14px 36px rgba(20,91,151,.18)",
        fontSize: 12,
        fontWeight: 850,
        textDecoration: "none",
      }}
    >
      <Network size={17} />
      AI Workforce
    </a>
  );
}
